var roa = require('../sri4node.js');
var context = require('./context.js');

var port = 5000;
var logsql, logrequests, logdebug, logmiddleware;
logsql = logrequests = logdebug = logmiddleware = false;

var base = 'http://localhost:' + port;

describe('Sri4node testing', function () {
  'use strict';
  before(function (done) {
    context.serve(roa, port, logsql, logrequests, logdebug, logmiddleware).then(done);
  });

  require('./testExpand.js')(base, logdebug);
  require('./testQueryUtils.js')(base, logdebug);
  require('./testCTE.js')(base, logdebug);
  require('./testListResource.js')(base, logdebug);
  require('./testOrderBy.js')(base, logdebug);
  require('./testRegularResource.js')(base, logdebug);
  require('./testAfterRead.js')(base, logdebug);
  require('./testSecurityContext.js')(base, logdebug);
  require('./testPutAndDelete.js')(base, logdebug);
  require('./testJSONB.js')(base, logdebug);
  require('./testInformationSchema.js')(logdebug);
  require('./testCustomRoutes.js')(base, logdebug);
  require('./defaultFilter/testDefaultFilterExact.js')(base, logdebug);
  require('./defaultFilter/testDefaultFilterCombination.js')(base, logdebug);
  require('./defaultFilter/testDefaultFilterContains.js')(base, logdebug);
  require('./defaultFilter/testDefaultFilterGreater.js')(base, logdebug);
  require('./defaultFilter/testDefaultFilterGreaterOrEqual.js')(base, logdebug);
  require('./defaultFilter/testDefaultFilterIn.js')(base, logdebug);
  require('./defaultFilter/testDefaultFilterLess.js')(base, logdebug);
  require('./defaultFilter/testDefaultFilterLessOrEqual.js')(base, logdebug);
  require('./defaultFilter/testDefaultFilterQ.js')(base, logdebug);
  require('./defaultFilter/testDefaultFilterRegEx.js')(base, logdebug);
  require('./defaultFilter/testDefaultFilterInvalidParameter.js')(base, logdebug);
  require('./relationsFilter/testRelationsFilterFromTypes.js')(base, logdebug);
  require('./relationsFilter/testRelationsFilterToTypes.js')(base, logdebug);
  require('./relationsFilter/testRelationsFilterNoType.js')(base, logdebug);
  require('./testModified.js')(base, logdebug);
  require('./testDocs.js')(base, logdebug);
  require('./testErrorHandling.js')(base, logdebug);
  require('./testResourceType.js')(base, logdebug);
//  require('./testIsolated.js')(base, logdebug);
});
