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
   "testAddForce",
   "testRemoveForce",
   "testOptimizeForce",
   "testAsync",
];

/**
 * A global variable containing the indexmanager to test
 * @type jala.IndexManager
 */
var index;

/**
 * A global id "counter"
 */
var idCounter = 0;

/**
 * Called before running the tests
 */
var setup = function() {
   // create the index to test
   var dir = new java.io.File(java.lang.System.getProperty("java.io.tmpdir"));
   index = new jala.IndexManager("test", dir, "de");
   return;
};

/**
 * Called after tests have finished. This method will be called
 * regarless whether the test succeeded or failed.
 */
var cleanup = function() {
   if (index) {
      // clear the index before removing the index directory itself
      index.getIndex().create();
      var dir = new java.io.File(java.lang.System.getProperty("java.io.tmpdir"), "test");
      if (dir.exists()) {
         var segments = new java.io.File(dir, "segments");
         if (segments.exists()) {
            segments["delete"]();
         } 
         dir["delete"]();
      }
   }
   return;
};

/**
 * Test adding a document object immediately
 */
var testAddForce = function() {
   index.add(createDocumentObject(), true);
   // check if the document was added correctly
   assertEqual(1, index.getIndex().size());
   return;
};

/**
 * Test removing a document object immediately
 */
var testRemoveForce = function() {
   var id = idCounter -1;
   index.remove(id, true);
   // check if the document was added correctly
   assertEqual(0, index.getIndex().size());
   return;
};

/**
 * Test immediate index optimization
 */
var testOptimizeForce = function() {
   index.optimize(true);
   assertFalse(index.hasOptimizingJob());
   assertFalse(index.needsOptimize());
   return;
};

/**
 * Test adding, removing and optimizing asynchronously
 */
var testAsync = function() {
   index.add(createDocumentObject());
   index.remove(idCounter -1);
   // index.optimize();
   while (index.hasWorker()) {
      java.lang.Thread.sleep(10);
   }
   // check if the document was added correctly
   assertEqual(0, index.getIndex().size());
   assertFalse(index.needsOptimize());
   return;
};

/**
 * Creates a new document object to be put into the index
 * @returns A newly created document object containing test data
 * @type helma.Search.Document
 */
var createDocumentObject = function() {
   var id = idCounter;
   var doc = new helma.Search.Document();
   doc.addField("id", id, {store: true, index: true, tokenize: false});
   doc.addField("name", "Document " + id, {store: true, index: true, tokenize: true});
   doc.addField("createtime", (new Date()).format("yyyyMMddHHmm"), {store: true, index: true, tokenize: false});
   idCounter += 1;
   return doc;
};
