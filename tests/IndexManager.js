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
   "testAdd",
   "testRemove",
   "testOptimize",
];

/**
 * Contains the index manager to test
 * @type jala.IndexManager
 */
var index;

/**
 * Contains the queue of the index manager
 */
var queue;

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
   queue = index.getQueue();
   index.start();
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
      index.stop();
   }
   return;
};

/**
 * Test adding a document object immediately
 */
var testAdd = function() {
   index.add(createDocumentObject());
   // check queue and job
   assertEqual(queue.size(), 1);
   assertEqual(queue.get(0).type, jala.IndexManager.Job.ADD);
   // check if the document was added correctly
   // but give the index manager time to process
   java.lang.Thread.currentThread().sleep(300);
   assertEqual(1, index.getIndex().size());
   assertEqual(queue.size(), 0);
   return;
};

/**
 * Test removing a document object immediately
 */
var testRemove = function() {
   var id = idCounter -1;
   index.remove(id);
   // check queue and job
   assertEqual(queue.size(), 1);
   assertEqual(queue.get(0).type, jala.IndexManager.Job.REMOVE);
   // check if the document was added correctly
   // but give the index manager time to process
   java.lang.Thread.currentThread().sleep(300);
   assertEqual(0, index.getIndex().size());
   assertEqual(queue.size(), 0);
   return;
};

/**
 * Test immediate index optimization
 */
var testOptimize = function() {
   index.optimize();
   // check queue and job
   assertEqual(queue.size(), 1);
   assertEqual(queue.get(0).type, jala.IndexManager.Job.OPTIMIZE);
   // give the index manager time to process
   java.lang.Thread.currentThread().sleep(300);
   assertFalse(index.hasOptimizingJob());
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
   doc.addField("id", id, {store: "yes", index: "unTokenized"});
   doc.addField("name", "Document " + id, {store: "yes", index: "tokenized"});
   doc.addField("createtime", (new Date()).format("yyyyMMddHHmm"), {store: "yes", index: "unTokenized"});
   idCounter += 1;
   return doc;
};
