## About

An implementtation of SRI (Standard ROA Interface). 
SRI is a set of standards to make RESTful interfaces.
It specifies how resources are accesses and queried, updated, etc...
More information can [be found here](https://docs.google.com/document/d/1KY-VV_AUJXxkMYrMwVFmyN4yIqil4zx4sKeV_RJFRnU/pub).

Currently the implementation supports storage on a postgres database.
Support for more databases/datastores may be added in the future.

## Installing

Installation is simple using npm :

    $ cd [your_project]
    $ npm install --save sri4node
    
You will also want to install Express.js and node-postgres :

    $ npm install --save express
    $ npm install --save pg
    
Express.js and node-postgress are technically no depedencies of sri4node.
But you need to pass them in when configuring. 
This allows you to keep full control over the order of registering express middleware, and allows you to share and configure the node-postgres library.

## Usage

Start by requiring the module in your code (as well as Express.js).
Then we'll create some convenient aliasses for the utility functions bundles with sri4node as well.

    var express = require('express');
    var app = express();
    var pg = require('pg');
    var sri4node = require('sri4node');
    var $u = sri4node.utils;
    var $m = sri4node.mapUtils;
    var $s = sri4node.schemaUtils;

Finally we configure handlers for 1 example resource :

    roa.configure(app,pg,
        {
            // For debugging SQL can be logged.
            logsql : false,
            // If no environments variable present, use this URL (for development)
            defaultdatabaseurl : "postgres://user:pwd@localhost:5432/postgres",
            // Define all resource you want to serve.
            resources : [
                {
                    // Base url, maps 1:1 with a table in postgres (same name, except the '/' is removed)
                    type: "/contents",
                    // Is this resource public ? (I.e.: Can it be read / updated / inserted publicly ?
                    public: true,
                    /*
                     JSON properties are mapped 1:1 to columns in the postgres table.
                     Every property can also register 3 possible functions:
                     - onupdate : is executed before UPDATE on the table
                     - oninsert : is executed before INSERT into the table
                     - onread : is executed after SELECT from the table
    
                     All 3 receive 2 parameters :
                     - the key they were registered on.
                     - the javascript element being PUT / or the results of the query just read for GET.
                     All functions are executed in order of listing here.
                     All are allowed to manipulate the element, before it is inserted/updated in the table.
                     */
                    map: {
                        authors: {},
                        themes: {},
                        html: {}
                    },
                    secure : [
                        // All functions are executed to check security.
                    ],
                    // Standard JSON Schema definition. Don't be fooled by the use of utility functions.
                    schemaUtils: {
                        $schema: "http://json-schema.org/schema#",
                        title: "An article on the websites/mailinglists.",
                        type: "object",
                        properties : {
                            authors: $s.string(1,256,"Comma-separated list of authors (firstname - lastname)."),
                            themes: $s.string(1,256,"Comma-separated list of themes this article belongs to."),
                            html: $s.string(1,2048,"HTML content of the article. HTML tags are restricted, to allow external styling.")
                        },
                        required: ["authors","themes","html"]
                    },
                    // Execute validation functions before update/inster.
                    // All functions are executed. If any of them return an error object the PUT operation returns 409.
                    // The output is a combination of all error objects returned by the validation rules/
                    validate: [
                    ],
                    // All queries are URLs. Any allowed URL parameter is configured here. A function can be registered.
                    // This function receives 2 parameters :
                    //  - the value of the request parameter (string)
                    //  - An object for adding SQL to the WHERE clause. This object has 2 methods :
                    //      * sql() : A method for appending sql.
                    //      * param() : A method for appending a parameter to the text sql.
                    //      * array() : A method for appending an array of parameters to the sql. (comma-separated)
                    //  All these methods can be chained, as a simple fluent interface.
                    //
                    //  All the supplied functions MUST extend the SQL statement with an 'AND' clause.
                    // (or not touch the statement, if they want to skip their processing).
                    query: {
                        authors: contains('authors'),
                        themes: contains('themes'),
                        html: contains('html')
                    },
                    /*
                    Hooks for post-processing can be registered to perform desired things, like clear a cache,
                    do further processing, etc..
    
                     - afterupdate
                     - afterinsert
                     - afterdelete
    
                    These post-processing functions receive 2 arguments:
    
                     - a 'db' object, that can be used to call roa4node.utils.executeSQL() and roa4node.utils.prepareSQL().
                       This object contains 2 things :
                        - client : a pg-connect client object
                        - done : a pg-connect done function
    
                     - the element that was just updated / created.
    
                     These functions must return a Q promise. When this promise resolves, all executed SQL will
                     be commited on the database. When this promise fails, all executed SQL (including the original insert
                     or update triggered by the API call) will be rolled back.
                    */
                    afterupdate: [],
                    afterinsert: [],
                    afterdelete: []
                }
            ]
        });

Now we can start Express.js serving up resources :

    app.listen(app.get('port'), function() {
        console.log("Node app is running at localhost:" + app.get('port'))
    });

## Documentation

sri4node has a very simple pipeline for mapping SRI resources onto a database. 
We explain the possible operations below : 
* reading regular resources (GET)
* updating/creating regular resources. (PUT)
* deleting regular resources. (DELETE)
* reading list resources (queries) (GET)

In essence you can define 1 regular resource per database row. A list resource corresponds to a query on a database table (and can be expanded to include multiple regular resource).

When reading a regular resource a database row is transformed into an SRI resource by doing things :

1. Check if you have permission by executing all registered functions in the mapping ('secure').
2. Retrieve the row and convert all columns into a JSON key-value pair (key maps directly to the database column name). All standard JSON datatypes are converted automatically to JSON. All values are passed through the 'onread' function for conversion, if defined. By default references to other resources (GUIDs in the database) are expanded to form a relative URL.
3. Add a $$meta section to the response document.

When creating or updating a regular resource a database row is updated/inserted by doing this :

1. Check if you have permission by executing all registered functions in the mapping (*secure*).
2. Perform schema validation on the incoming resource.
3. Execute *validate* functions.
4. Convert the JSON document into a simple key-value object. Keys map 1:1 with database columns. All incoming values are passed through the *onwrite*/*oninsert* function for conversion, if defined. By default references to other resources (relative links in the JSON document) are reduced to foreign keys (GUIDs) in the database.
5. insert or update the database row.
6. Execute *afterupdate'* or *afterread'* functions.

When deleting a regular resource :

1. Check if you have permission by executing all registered functions in the mapping (*secure*).
2. Delete the row from the database.
3. Execute *afterdelete* functions.

When reading a list resource :

1. Check if you have read permission by executing all registered functions in the mapping (*secure*).
2. Generate a COUNT statement and execute all registered 'query' functions to annotated the WHERE clause of the query.
3. Execute a SELECT statement and execute all registered 'query' functions to annotated the WHERE clause of the query.
4. Retrieve the results, and expand if necessary (i.e. generate a JSON document from the result row). See above for more details.
5. Build a list resource with a $$meta section, and return it to the user.

## Function Definitions

The functions used in the configuration of sri4node receive input, and should return :

### onread / oninsert / onupdate

### secure

### validate

### query

### afterupdate

### afterinsert

### afterdelete

## Contributors

Contributions are welcom. Contact me on dimitry_dhondt@yahoo.com.

## License

The software is licensed under [LGPL license](https://www.gnu.org/licenses/lgpl.html). 

## TO DO

Development will focus on :
- Adding support for generic server-side expansion.
- Adding support for an HTTP cache for reading, avoiding database hits for read operations.