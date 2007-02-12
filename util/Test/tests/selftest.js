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
 * Declare which test methods should be run in which order
 * @type Array
 * @final
 */
var tests = [
   "testEvalArguments",
   "testArgsContainComment",
   "testGetComment",
   "testGetValue",
   "testAssertionFunctions",
];

/**
 * Test for jala.Test.evalArguments
 */
var testEvalArguments = function testEvalArguments() {
   var args;
   // test arguments without a comment
   args = [true, false, 1, "one", new Date()];
   jala.Test.evalArguments(args, 5);
   // test arguments with a comment
   args = ["a comment", true, false, 1, "one", new Date()];
   jala.Test.evalArguments(args, 5);
   return;
};

/**
 * Test for jala.Test.containsComment
 */
var testArgsContainComment = function testArgsContainComment() {
   var args = ["a comment", true];
   if (jala.Test.argsContainComment(args, 1) !== true) {
      throw new jala.Test.TestException(null,
                      "Argument array is supposed to contain a comment, but doesn't");
   }
   return;
};

/**
 * Test for jala.Test.getComment
 */
var testGetComment = function testGetComment() {
   var args = ["a comment", true];
   if (jala.Test.getComment(args, 1) !== args[0]) {
      throw new jala.Test.TestException(null, "Couldn't get comment");
   }
   return;
};

/**
 * Test for jala.Test.getValue
 */
var testGetValue = function testGetValue() {
   var args = ["a comment", 1, 2, 3];
   if (jala.Test.getValue(args, 3, 1) !== args[2]) {
      throw new jala.Test.TestException("Couldn't get correct argument value");
   }
   return;
};

/**
 * Testing assertion functions
 */
var testAssertionFunctions = function testAssertionFunctions() {
   assertTrue("just a comment", true);
   assertFalse("just a comment", false);
   assertEqual(1, 1);
   assertNotEqual(1, 2);
   assertNull(null);
   assertNotNull(true);
   assertUndefined(undefined);
   assertNotUndefined(true);
   assertNaN("one");
   assertNotNaN(1);
   assertStringContains("just a self test", "self");
   assertMatch("just a self test", /^just/);
   return;
};
