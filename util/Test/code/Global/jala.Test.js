//
// Jala Project [http://opensvn.csie.org/traccgi/jala]
//
// Copyright 2004 ORF Online und Teletext GmbH
//
// Licensed under the Apache License, Version 2.0 (the ``License'');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an ``AS IS'' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// $Revision$
// $LastChangedBy$
// $LastChangedDate$
// $HeadURL$
//


/**
 * @fileoverview Fields and methods of the jala.Test class.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * HelmaLib dependencies
 */
app.addRepository("modules/helma/Http.js");

/**
 * Constructs a new Test instance.
 * @class Provides various methods for automated tests.
 * This is essentially a port of JSUnit (http://www.edwardh.com/jsunit/)
 * suitable for testing Helma applications.
 * @param {Number} capacity The capacity of the cache
 * @constructor
 */
jala.Test = function() {

   /**
    * Contains the number of tests that were executed
    * @type Number
    */
   this.testsRun = 0;

   /**
    * Contains the number of tests that failed
    * @type Boolean
    */
   this.testsFailed = 0;

   /**
    * Contains the number of test functions that passed
    * @type Number
    */
   this.functionsPassed = 0;

   /**
    * Contains the number of test functions that failed
    * @type Number
    */
   this.functionsFailed = 0;

   /**
    * An Array containing the results of this Test instance.
    * @type Array
    */
   this.results = [];

   return this;
};



/*************************************************************
 ***** S T A T I C   F I E L D S   A N D   M E T H O D S *****
 *************************************************************/


/**
 * Constant indicating "passed" status
 * @type String
 * @final
 */
jala.Test.PASSED = "passed";

/**
 * Constant indicating "failed" status
 * @type String
 * @final
 */
jala.Test.FAILED = "failed";

/**
 * Helper method useable for displaying a value
 * @param {Object} The value to render
 * @returns The value rendered as string
 * @type String
 */
jala.Test.valueToString = function(val) {
   res.push();
   if (val === null) {
      res.write("null");
   } else if (val === undefined) {
      res.write("undefined");
   } else {
      if (val.constructor == String) {
         res.write('"' + val.toString() + '"');
      } else {
         res.write(val.toString());
      }
      res.write(" (");
      if (val.constructor.name != null) {
         res.write(val.constructor.name);
      } else {
         res.write(typeof(val));
      }
      res.write(")");
   }
   return res.pop();
};

/**
 * Returns the directory containing the test files.
 * The location of the directory is either defined by the
 * application property "jala.testDir" or expected to be one level
 * above the application directory (and named "tests")
 * @returns The directory containing the test files
 * @type helma.File
 */
jala.Test.getTestsDirectory = function() {
   var dir;
   if (getProperty("jala.testDir") != null) {
      dir = new helma.File(getProperty("tests"));
   }
   if (!dir || !dir.exists()) {
      var appDir = new helma.File(app.dir);
      dir = new helma.File(appDir.getParent(), "tests");
      if (!dir.exists())
         return null;
   }
   return dir;
};

/**
 * Returns an array containing the test files located
 * in the directory.
 * @returns An array containing the names of all test files
 * @type Array
 */
jala.Test.getTestFiles = function() {
   var dir;
   if ((dir = jala.Test.getTestsDirectory()) != null) {
      return dir.list(/.*\.js/).sort();
   }
   return null;
};

/**
 * Returns the testfile with the given name
 * @param {String} fileName The name of the test file
 * @returns The test file
 * @type helma.File
 */
jala.Test.getTestFile = function(fileName) {
   var dir = jala.Test.getTestsDirectory();
   if (dir != null) {
      return new helma.File(dir, fileName);
   }
   return null;
};

/**
 * @param {Number} nr The number of arguments to be expected
 * @param {Object} args The arguments array.
 * @returns True in case the number of arguments matches
 * the expected amount, false otherwise.
 * @type Boolean
 */
jala.Test.evalArguments = function(args, argsExpected) {
   if (!(args.length == argsExpected ||
             (args.length == argsExpected + 1 && typeof(args[0]) == "string"))) {
      throw new jala.Test.ArgumentsException("Insufficient arguments passed to assertion function");
   }
   return;
};

/**
 * Returns true if the arguments array passed as argument
 * contains an additional comment.
 * @param {Array} args The arguments array to check for an existing comment.
 * @param {Number} argsExpected The number of arguments expected by the
 * assertion function.
 * @returns True if the arguments contain a comment, false otherwise.
 * @type Boolean
 */
jala.Test.argsContainComment = function(args, argsExpected) {
   return !(args.length == argsExpected
               || (args.length == argsExpected + 1 && typeof(args[0]) != "string"))
};

/**
 * Cuts out the comment from the arguments array passed
 * as argument and returns it. CAUTION: this actually modifies
 * the arguments array!
 * @param {Array} args The arguments array.
 * @returns The comment, if existing. Null otherwise.
 * @type String
 */
jala.Test.getComment = function(args, argsExpected) {
   if (jala.Test.argsContainComment(args, argsExpected))
      return args[0];
   return null;
};

/**
 * Returns the argument on the index position in the array
 * passed as arguments. This method respects an optional comment
 * at the beginning of the arguments array.
 * @param {Array} args The arguments to retrieve the non-comment
 * value from.
 * @param {Number} idx The index position on which the value to
 * retrieve is to be expected if <em>no</em> comment is existing.
 * @returns The non-comment value, or null.
 * @type Object
 */
jala.Test.getValue = function(args, argsExpected, idx) {
   return jala.Test.argsContainComment(args, argsExpected) ? args[idx+1] : args[idx];
};


/**
 * Creates a stack trace and parses it for display.
 * @param {String} message The failure message
 * @returns The parsed stack trace
 * @type String
 */
jala.Test.getStackTrace = function(message) {
   // store the file and line-number of the failed call
   var ex = new Packages.org.mozilla.javascript.EvaluatorException(message || "");
   ex.fillInStackTrace();
   var trace = ex.getStackTrace();
   var el, fileName, lineNumber;
   var stack = [];
   // parse the stack trace and keep only the js elements
   var cnt = 0;
   for (var i=0;i<trace.length;i++) {
      el = trace[i];
      if (!(fileName = el.getFileName()))
         continue;
      if ((lineNumber = el.getLineNumber()) == -1)
         continue;
      if (fileName.endsWith(".js") || fileName.endsWith(".hac") || fileName.endsWith(".hsp")) {
         // ignore the first two lines of the stack trace, since
         // these always belong to the test framework
         if (cnt > 2) {
            stack[stack.length] = "at " + fileName + ", line " + lineNumber;
         }
         if (fileName.endsWith(res.meta.currentTest)) {
            break;
         }
         cnt += 1;
      }
   }
   return stack.join("\n");
};

/**
 * Duplicates the schema with the name passed as argument
 * in the embedded test database.
 * FIXME: for now prevent this method from appearing in the
 * API docs by marking it as private
 * @returns The embedded database object
 * @type jala.EmbeddedDatabase
 * @private
 */
jala.Test.createDatabase = function(schemaName) {
   // the database files are stored in a subdirectory
   // in the location where the test files are stored
   var dir = jala.Test.getTestsDirectory();
   var dbDir = new helma.File(dir, schemaName);
   var testDb = new jala.EmbeddedDatabase(dbDir.getAbsolutePath());
   // start the embedded database
   if (!testDb.start(true)) {
      throw "Unable to initialize embedded db!";
   }

   // retrieve the metadata for all tables in this schema
   var dbSource = app.getDbSource(schemaName);
   var con = dbSource.getConnection();
   var meta = con.getMetaData();
   var t = meta.getTables(null, schemaName, "%", null);
   var tableName, columns;
   while (t.next()) {
      tableName = t.getString(3).toUpperCase();
      if (testDb.tableExists(tableName)) {
         testDb.dropTable(tableName);
      }
      // create an array containing the necessary column metadata
      var columns = [];
      var c = meta.getColumns(null, schemaName, tableName, "%");
      var columnName, columnType, columnTypeName, columnSize, columnNullable;
      while (c.next()) {
         columns[columns.length] = {
            name: c.getString(4),
            type: c.getInt(5),
            length: c.getInt(7),
            nullable: (c.getInt(11) == meta.typeNoNulls) ? false : true,
            "default": c.getString(13),
            precision: c.getInt(9),
            scale: c.getInt(10)
         }
      }

      // retrieve the primary keys of the table
      var pk = meta.getPrimaryKeys(null, schemaName, tableName);
      var keys = [];
      while (pk.next()) {
         keys[keys.length] = pk.getString(4);
      }
      // create the table in the embedded database
      testDb.createTable(tableName, columns, keys.length > 0 ? keys : null);
   }
   // cleanup
   con.close();
   testDb.stop();
   return testDb;
};

/**
 * Prepares the per-thread global scope for the test run.
 * This method defines all assertion methods as global methods,
 * and creates a default instantiation of the Http client
 * for convenience.
 * @private
 */
jala.Test.prepareTestScope = function() {
   // define global assertion functions
   for (var i in jala.Test.prototype) {
      if (i.indexOf("assert") == 0) {
         global[i] = jala.Test.prototype[i];
      }
   }
   // instantiate a global HttpClient
   global.httpClient = new jala.Test.HttpClient();
   return;
}



/*******************************
 ***** E X C E P T I O N S *****
 *******************************/


/**
 * Creates a new Exception instance
 * @class Base exception class
 * @returns A newly created Exception instance
 * @constructor
 */
jala.Test.Exception = function Exception() {
   return this;
};

/** @ignore */
jala.Test.Exception.prototype.toString = function() {
   return "jala.Test.Exception: " + this.message + "]";
};

/**
 * Creates a new TestException instance
 * @class Instances of this exception are thrown whenever an
 * assertion function fails
 * @param {String} comment An optional comment
 * @param {String} message The failure message
 * @returns A newly created TestException instance
 * @constructor
 */
jala.Test.TestException = function TestException(comment, message) {
   this.functionName = null;
   this.comment = comment;
   this.message = message;
   this.stackTrace = jala.Test.getStackTrace(message);
   return this;
};
jala.Test.TestException.prototype = new jala.Test.Exception();

/** @ignore */
jala.Test.TestException.prototype.toString = function() {
   return "jala.Test.TestException in " + this.functionName +
          ": " + this.message;
};

/**
 * Creates a new ArgumentsException instance
 * @class Instances of this exception are thrown whenever an assertion
 * function is called with incorrect or insufficient arguments
 * @param {String} message The failure message
 * @returns A newly created ArgumentsException instance
 * @constructor
 */
jala.Test.ArgumentsException = function ArgumentsException(message) {
   this.functionName = null;
   this.message = message;
   this.stackTrace = jala.Test.getStackTrace(message);
   return this;
};
jala.Test.ArgumentsException.prototype = new jala.Test.Exception();

/** @ignore */
jala.Test.ArgumentsException.prototype.toString = function() {
   return "jala.Test.ArgumentsException in " + this.functionName +
          ": " + this.message;
};

/**
 * Creates a new EvaluatorException instance
 * @class Instances of this exception are thrown when attempt
 * to evaluate the test code fails
 * @param {String} message The failure message
 * @returns A newly created EvaluatorException instance
 * @constructor
 */
jala.Test.EvaluatorException = function EvaluatorException(message) {
   this.message = message;
   return this;
};
jala.Test.EvaluatorException.prototype = new jala.Test.Exception();

/** @ignore */
jala.Test.EvaluatorException.prototype.toString = function() {
   return "jala.Test.EvaluatorException: " + this.message;
};



/*************************************************
 ***** R E S U L T   C O N S T R U C T O R S *****
 *************************************************/


/**
 * Constructs a new TestResult instance
 * @class Instances of this class represent the result of the execution
 * of a single test file
 * @param {String} testFileName The name of the excecuted test file
 * @returns A new TestResult instance
 * @constructor
 */
jala.Test.TestResult = function(testFileName) {
   this.name = testFileName;
   this.elapsed = 0;
   this.status = jala.Test.PASSED;
   this.log = [];
   return this;
};

/**
 * Constructs a new TestFunctionResult instance
 * @class Instances of this class represent the result of the successful
 * execution of a single test function (failed executions will be represented
 * as Exceptions in the log of a test result).
 * @param {String} functionName The name of the excecuted test function
 * @param {Date} startTime A Date instance marking the begin of the test
 * @returns A new TestFunctionResult instance
 * @constructor
 */
jala.Test.TestFunctionResult = function(functionName, startTime) {
   this.functionName = functionName;
   this.elapsed = (new Date()) - startTime;
   return this;
};



/*************************************************
 ***** P R O T O T Y P E   F U N C T I O N S *****
 *************************************************/


/**
 * Executes a single test file
 * @param {helma.File} testFile The file containing the test to run
 */
jala.Test.prototype.executeTest = function(testFile) {
   var testFileName = testFile.getName();
   // store the name of the current test in res.meta.currentTest
   // as this is needed in getStackTrace
   res.meta.currentTest = testFileName;

   var cx = Packages.org.mozilla.javascript.Context.enter();
   var code = new java.lang.String(testFile.readAll() || "");
   var testResult = new jala.Test.TestResult(testFileName);
   try {
      // prepare the test scope
      jala.Test.prepareTestScope();
      // evaluate the test file in the per-thread which is garbage
      // collected at the end of the test run and prevents the application
      // scope from being polluted
      cx.evaluateString(global, code, testFileName, 1, null);
      if (!global.tests || global.tests.constructor != Array || global.tests.length == 0) {
         throw "Please define an Array named 'tests' containing the names of the test functions to run";
      }
      var start = new Date();
      // run the test
      try {
         if (global.setup != null && global.setup instanceof Function) {
            // setup function exists, so call it
            testResult.log[testResult.log.length] = this.executeTestFunction("setup");
         }
         // run all test methods defined in the array "tests"
         var functionName;
         for (var i=0;i<global.tests.length;i++) {
            functionName = global.tests[i];
            if (!global[functionName] || global[functionName].constructor != Function) {
               throw new jala.Test.EvaluatorException("Test function '" +
                                         functionName + "' is not defined.");
            }
            testResult.log[testResult.log.length] = this.executeTestFunction(functionName);
         }
      } catch (e) {
         this.testsFailed += 1;
         testResult.status = jala.Test.FAILED;
         testResult.log[testResult.log.length] = e;
      } finally {
         // call any existing "cleanup" method
         if (global.cleanup != null && global.cleanup instanceof Function) {
            testResult.log[testResult.log.length] = this.executeTestFunction("cleanup");
         }
      }
   } catch (e) {
      this.testsFailed += 1;
      testResult.status = jala.Test.FAILED;
      testResult.log[testResult.log.length] = new jala.Test.EvaluatorException(e.toString());
   } finally {
      // exit the js context created above
      cx.exit();
      // clear res.meta.currentTest
      res.meta.currentTest = null;
   }
   testResult.elapsed = (new Date()) - start;
   this.results[this.results.length] = testResult;
   return;
};

/**
 * Executes a single test function
 * @param {String} functionName The name of the test function to execute
 */
jala.Test.prototype.executeTestFunction = function(functionName) {
   // store the name of the current function in res.meta.currentTestFunction
   res.meta.currentTestFunction = functionName;
   var start = new Date();
   try {
      global[functionName]();
      this.functionsPassed += 1;
      return new jala.Test.TestFunctionResult(functionName, start);
   } catch (e) {
      if (e instanceof jala.Test.Exception) {
         e.functionName = functionName;
      } else {
         e = new jala.Test.EvaluatorException(e.toString());
      }
      this.functionsFailed += 1;
      throw e;
   } finally {
      // clear res.meta.currentFunction
      res.meta.currentTestFunction = null;
   }
};

/**
 * Main test execution function
 * @param {String|Array} what Either the name of a single test file
 * or an array containing the names of several function files that should
 * be executed.
 */
jala.Test.prototype.execute = function(what) {
   var self = this;
   var executeTest = function(fileName) {
      var file = jala.Test.getTestFile(fileName);
      if (file != null && file.exists()) {
         self.testsRun += 1;
         self.executeTest(file);
      }
   };

   if (what instanceof Array) {
      for (var i in what) {
         executeTest(what[i]);
      }
   } else {
      executeTest(what);
   }
   return;
};

/** @ignore */
jala.Test.prototype.toString = function() {
   return "[jala.Test]";
};

/**
 * Renders the results of all tests done by this test instance
 * to response.
 */
jala.Test.prototype.renderResults = function() {
   if (this.results.length > 0) {
      for (var i=0;i<this.results.length;i++) {
         this.renderResult(this.results[i]);
      }
   }
   return;
};

/**
 * Renders a single the result of a single test
 * @param {jala.Test.TestResult} The result to render
 */
jala.Test.prototype.renderResult = function(result) {
   res.push();
   var logItem;
   for (var i=0;i<result.log.length;i++) {
      logItem = result.log[i];
      if (logItem instanceof jala.Test.Exception) {
         renderSkin("jala.Test.log.failed", logItem);
      } else {
         renderSkin("jala.Test.log.passed", logItem);
      }
   }
   var param = {
      name: result.name,
      elapsed: result.elapsed,
      status: result.status,
      log: res.pop()
   }
   renderSkin("jala.Test.result", param);
   return;
};



/***********************
 ***** M A C R O S *****
 ***********************/


/**
 * Renders the list of available tests
 */
jala.Test.prototype.list_macro = function() {
   var list = jala.Test.getTestFiles();
   if (list && list.length > 0) {
      var fileName, skinParam;
      for (var i=0;i<list.length;i++) {
         fileName = list[i];
         skinParam = {name: fileName};
         if (req.data.test == fileName ||
                   (req.data.test_array && req.data.test_array.contains(fileName))) {
            skinParam.checked = "checked";
         }
         renderSkin("jala.Test.item", skinParam);
      }
   }
   return;
};

/**
 * Renders the test results
 */
jala.Test.prototype.results_macro = function() {
   this.renderResults();
   return;
};



/*************************************************
 ***** A S S E R T I O N   F U N C T I O N S *****
 *************************************************/


/**
 * Checks if the value passed as argument is boolean true.
 * @param {Object} val The value that should be boolean true.
 * @throws jala.Test.ArgumentsException
 * @throws jala.Test.TestException
 */
jala.Test.prototype.assertTrue = function assertTrue(val) {
   var functionName = arguments.callee.name;
   var argsExpected = arguments.callee.length;
   jala.Test.evalArguments(arguments, argsExpected);
   var comment = jala.Test.getComment(arguments, argsExpected);
   var value = jala.Test.getValue(arguments, argsExpected, 0);
   if (typeof(value) != "boolean") {
      throw new jala.Test.ArgumentsException("Invalid argument to assertTrue(boolean): " +
                      jala.Test.valueToString(value));
   } else if (value !== true) {
      throw new jala.Test.TestException(comment,
                      "assertTrue(boolean) called with argument " +
                      jala.Test.valueToString(value));
   }
   return;
};

/**
 * Checks if the value passed as argument is boolean false.
 * @param {Object} val The value that should be boolean false.
 * @throws jala.Test.ArgumentsException
 * @throws jala.Test.TestException
 */
jala.Test.prototype.assertFalse = function assertFalse(val) {
   var functionName = arguments.callee.name;
   var argsExpected = arguments.callee.length;
   jala.Test.evalArguments(arguments, argsExpected);
   var comment = jala.Test.getComment(arguments, argsExpected);
   var value = jala.Test.getValue(arguments, argsExpected, 0);
   if (typeof(value) != "boolean") {
      throw new jala.Test.ArgumentsException("Invalid argument to assertFalse(boolean): " +
                      jala.Test.valueToString(value));
   } else if (value === true) {
      throw new jala.Test.TestException(comment,
                      "assertFalse(boolean) called with argument " +
                      jala.Test.valueToString(value));
   }
   return;
};

/**
 * Checks if the values passed as arguments are equal.
 * @param {Object} val1 The value that should be compared to the second argument.
 * @param {Object} val2 The value that should be compared to the first argument.
 * @throws jala.Test.ArgumentsException
 * @throws jala.Test.TestException
 */
jala.Test.prototype.assertEqual = function assertEqual(val1, val2) {
   var functionName = arguments.callee.name;
   var argsExpected = arguments.callee.length;
   jala.Test.evalArguments(arguments, argsExpected);
   var comment = jala.Test.getComment(arguments, argsExpected);
   var value1 = jala.Test.getValue(arguments, argsExpected, 0);
   var value2 = jala.Test.getValue(arguments, argsExpected, 1);
   if (value1 !== value2) {
      throw new jala.Test.TestException(comment,
                      "Expected " + jala.Test.valueToString(value1) +
                      " to be equal to " + jala.Test.valueToString(value2));
   }
   return;
};

/**
 * Checks if the values passed as arguments are not equal.
 * @param {Object} val1 The value that should be compared to the second argument.
 * @param {Object} val2 The value that should be compared to the first argument.
 * @throws jala.Test.ArgumentsException
 * @throws jala.Test.TestException
 */
jala.Test.prototype.assertNotEqual = function assertNotEqual(val1, val2) {
   var functionName = arguments.callee.name;
   var argsExpected = arguments.callee.length;
   jala.Test.evalArguments(arguments, argsExpected);
   var value1 = jala.Test.getValue(arguments, argsExpected, 0);
   var value2 = jala.Test.getValue(arguments, argsExpected, 1);
   var comment = jala.Test.getComment(arguments, argsExpected);
   if (value1 === value2) {
      throw new jala.Test.TestException(comment,
                      "Expected " + jala.Test.valueToString(value1) +
                      " to be not equal to " + jala.Test.valueToString(value2));
   }
   return;
};

/**
 * Checks if the value passed as argument is null.
 * @param {Object} val The value that should be null.
 * @throws jala.Test.ArgumentsException
 * @throws jala.Test.TestException
 */
jala.Test.prototype.assertNull = function assertNull(val) {
   var functionName = arguments.callee.name;
   var argsExpected = arguments.callee.length;
   jala.Test.evalArguments(arguments, argsExpected);
   var comment = jala.Test.getComment(arguments, argsExpected);
   var value = jala.Test.getValue(arguments, argsExpected, 0);
   if (value !== null) {
      throw new jala.Test.TestException(comment,
                           "Expected " + jala.Test.valueToString(value) +
                           " to be null");
   }
   return;
};

/**
 * Checks if the value passed as argument is not null.
 * @param {Object} val The value that should be not null.
 * @throws jala.Test.ArgumentsException
 * @throws jala.Test.TestException
 */
jala.Test.prototype.assertNotNull = function assertNotNull(val) {
   var functionName = arguments.callee.name;
   var argsExpected = arguments.callee.length;
   jala.Test.evalArguments(arguments, argsExpected);
   var comment = jala.Test.getComment(arguments, argsExpected);
   var value = jala.Test.getValue(arguments, argsExpected, 0);
   if (value === null) {
      throw new jala.Test.TestException(comment,
                           "Expected " + jala.Test.valueToString(value) +
                           " to be not null");
   }
   return;
};

/**
 * Checks if the value passed as argument is undefined.
 * @param {Object} val The value that should be undefined.
 * @throws jala.Test.ArgumentsException
 * @throws jala.Test.TestException
 */
jala.Test.prototype.assertUndefined = function assertUndefined(val) {
   var functionName = arguments.callee.name;
   var argsExpected = arguments.callee.length;
   jala.Test.evalArguments(arguments, argsExpected);
   var comment = jala.Test.getComment(arguments, argsExpected);
   var value = jala.Test.getValue(arguments, argsExpected, 0);
   if (value !== undefined) {
      throw new jala.Test.TestException(comment,
                           "Expected " + jala.Test.valueToString(value) +
                           " to be undefined");
   }
   return;
};

/**
 * Checks if the value passed as argument is not undefined.
 * @param {Object} val The value that should be not undefined.
 * @throws jala.Test.ArgumentsException
 * @throws jala.Test.TestException
 */
jala.Test.prototype.assertNotUndefined = function assertNotUndefined(val) {
   var functionName = arguments.callee.name;
   var argsExpected = arguments.callee.length;
   jala.Test.evalArguments(arguments, argsExpected);
   var comment = jala.Test.getComment(arguments, argsExpected);
   var value = jala.Test.getValue(arguments, argsExpected, 0);
   if (value === undefined) {
      throw new jala.Test.TestException(comment,
                           "Expected argument to be not undefined");
   }
   return;
};

/**
 * Checks if the value passed as argument is NaN.
 * @param {Object} val The value that should be NaN.
 * @throws jala.Test.ArgumentsException
 * @throws jala.Test.TestException
 */
jala.Test.prototype.assertNaN = function assertNaN(val) {
   var functionName = arguments.callee.name;
   var argsExpected = arguments.callee.length;
   jala.Test.evalArguments(arguments, argsExpected);
   var comment = jala.Test.getComment(arguments, argsExpected);
   var value = jala.Test.getValue(arguments, argsExpected, 0);
   if (!isNaN(value)) {
      throw new jala.Test.TestException(comment,
                           "Expected " + jala.Test.valueToString(value) +
                           " to be NaN");
   }
   return;
};

/**
 * Checks if the value passed as argument is not NaN.
 * @param {Object} val The value that should be not NaN.
 * @throws jala.Test.ArgumentsException
 * @throws jala.Test.TestException
 */
jala.Test.prototype.assertNotNaN = function assertNotNaN(val) {
   var functionName = arguments.callee.name;
   var argsExpected = arguments.callee.length;
   jala.Test.evalArguments(arguments, argsExpected);
   var comment = jala.Test.getComment(arguments, argsExpected);
   var value = jala.Test.getValue(arguments, argsExpected, 0);
   if (isNaN(value)) {
      throw new jala.Test.TestException(comment,
                           "Expected " + jala.Test.valueToString(value) +
                           " to be a number");
   }
   return;
};

/**
 * Checks if the value passed as argument contains the pattern specified.
 * @param {String} val The string that should contain the pattern
 * @param {String} str The string that should be contained
 * @throws jala.Test.ArgumentsException
 * @throws jala.Test.TestException
 */
jala.Test.prototype.assertStringContains = function assertStringContains(val, str) {
   var functionName = arguments.callee.name;
   var argsExpected = arguments.callee.length;
   jala.Test.evalArguments(arguments, argsExpected);
   var comment = jala.Test.getComment(arguments, argsExpected);
   var value = jala.Test.getValue(arguments, argsExpected, 0);
   var pattern = jala.Test.getValue(arguments, argsExpected, 1);
   if (pattern.constructor == String) {
      if (value.indexOf(pattern) < 0) {
         throw new jala.Test.TestException(comment,
                              "Expected string " + jala.Test.valueToString(pattern) +
                              " to be found in " + jala.Test.valueToString(value));
      }
   } else {
      throw new jala.Test.ArgumentsException("Invalid argument to assertStringContains(string, string): " +
                      jala.Test.valueToString(pattern));
   }
   return;
};

/**
 * Checks if the regular expression matches the string.
 * @param {String} val The string that should contain the regular expression pattern
 * @param {RegExp} rxp The regular expression that should match the value
 * @throws jala.Test.ArgumentsException
 * @throws jala.Test.TestException
 */
jala.Test.prototype.assertMatch = function assertStringContains(val, rxp) {
   var functionName = arguments.callee.name;
   var argsExpected = arguments.callee.length;
   jala.Test.evalArguments(arguments, argsExpected);
   var comment = jala.Test.getComment(arguments, argsExpected);
   var value = jala.Test.getValue(arguments, argsExpected, 0);
   var exp = jala.Test.getValue(arguments, argsExpected, 1);
   if (exp.constructor == RegExp) {
      if (exp.test(value) == false) {
         throw new jala.Test.TestException(comment,
                              "Expected pattern " + jala.Test.valueToString(exp) +
                              " to match " + jala.Test.valueToString(value));
      }
   } else {
      throw new jala.Test.ArgumentsException("Invalid argument to assertMatch(string, regexp): " +
                      jala.Test.valueToString(pattern));
   }
   return;
};



/*********************************
 ***** H T T P   C L I E N T *****
 *********************************/


/**
 * Constructs a new HttpClient instance
 * @class Instances of this class represent a http client useable for
 * testing, as any session cookies received by the tested application
 * are stored and used for subsequent requests, allowing simple "walkthrough"
 * tests.
 * @returns A newly constructed HttpClient
 * @constructor
 */
jala.Test.HttpClient = function() {
   var client = new helma.Http();
   var cookie = null;

   /**
    * Returns the http client used
    * @return The http client used
    * @type helma.Http
    */
   this.getClient = function() {
      return client;
   };
   
   /**
    * Sets the cookie to use for subsequent requests using this client
    * @param {Object} c The cookie object as received from helma.Http.getUrl
    */
   this.setCookie = function(c) {
      cookie = c;
      return;
   };

   /**
    * Returns the cookie set for this http client
    */
   this.getCookie = function() {
      return cookie;
   };

   return this;
};

/**
 * Sends a HTTP request to the Url passed as argument
 * @param {String} method The HTTP method to use
 * @param {String} url The url to request
 * @param {Object} param A parameter object to use with this request
 * @return An object containing response values
 * @see helma.Http.prototype.getUrl
 */
jala.Test.HttpClient.prototype.executeRequest = function(method, url, param) {
   var client = this.getClient();
   client.setMethod(method);
   var cookie = this.getCookie();
   if (cookie != null) {
       client.setCookie(cookie.name, cookie.value);
   }
   // prevent any caching at the remote server or any intermediate proxy
   client.setHeader("Cache-control", "no-cache,max-age=0");
   client.setContent(param);
   // disable following redirects, since cookies would get lost
   // instead, handle a resulting redirect manually
   client.setFollowRedirects(false);
   var result = client.getUrl(url);
   if (result.cookie != null) {
      this.setCookie(result.cookie);
   }
   if (result.location != null) {
      // received a redirect location, so follow it
      result = this.executeRequest("GET", result.location);
   }
   return result;
};

/**
 * Convenience method for requesting the url passed as argument
 * using method GET
 * @param {String} url The url to request
 * @param {Object} param A parameter object to use with this request
 * @return An object containing response values
 * @see helma.Http.prototype.getUrl
 */
jala.Test.HttpClient.prototype.getUrl = function(url, param) {
   return this.executeRequest("GET", url, param);
};

/**
 * Convenience method for submitting a form.
 * @param {String} url The url to request
 * @param {Object} param A parameter object to use with this request
 * @return An object containing response values
 * @see helma.Http.prototype.getUrl
 */
jala.Test.HttpClient.prototype.submitForm = function(url, param) {
   return this.executeRequest("POST", url, param);
};

/** @ignore */
jala.Test.HttpClient.prototype.toString = function() {
   return "[jala.Test.HttpClient]";
};
