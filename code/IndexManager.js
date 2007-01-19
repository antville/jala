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
 * @fileoverview Fields and methods of the jala.IndexManager class.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * HelmaLib dependencies
 */
app.addRepository("modules/helma/Search.js");

/**
 * Constructs a new IndexManager object.
 * @class This class basically sits on top of a helma.Search.Index instance
 * and provides methods for adding, removing, optimizing and rebuilding
 * the underlying index. All methods except rebuilding are executed
 * asynchronously using an internal queue that contains jobs created
 * for each call of add/remove/optimize. Rebuilding is somehow different
 * as it puts this manager into rebuilding mode where all following
 * calls of add/remove/optimize are queued, but the queue is not flushed
 * until rebuilding has finished. This ensures that objects that have been
 * modified during a rebuilding process are re-indexed properly afterwards.
 * @param {String} name The name of the index, which is the name of the directory
 * the index already resides or will be created in.
 * @param {helma.File} dir The base directory where this index's directory
 * is already existing or will be created in.
 * @param {String} lang The language of the documents in this index. This leads
 * to the proper Lucene analyzer being used for indexing documents.
 * @constructor
 */
jala.IndexManager = function(name, dir, lang) {
   /**
    * Private variable containing the index managed by
    * this IndexManager instance.
    * @private 
    */
   var index = null;

   /**
    * Private variable containing a status indicator.
    * @type Number
    * @private
    */
   var status = jala.IndexManager.NORMAL;

   /**
    * Hashtable containing queued objects to add/remove from the
    * underlying index.
    * @private
    */
   var queue = new jala.IndexManager.Queue();

   /**
    * Private variable containing the worker flushing the queue
    * @type jala.AsyncRequest
    * @private
    */
   var worker = null;

   /**
    * Private method that prepends the name of this index queue
    * to the message passed as argument, and calls the application
    * logger.
    * @param {String} msg The message to log.
    * @private
    */
   var log = function(msg) {
      app.logger.info("[" + name + "] " + msg);
      return;
   };

   /**
    * Private method holding the version number of the underlying index
    * (see org.apache.lucene.index.IndexReader.getCurrentVersion()).
    * This is used to determine if the index should be optimized.
    * @type Number
    * @private
    */
   var version = 0;

   /**
    * Returns the milliseconds elapsed between the current timestamp
    * and the one passed as argument.
    * @returns The elapsed time in millis.
    * @type Number
    * @private
    */
   var getRuntime = function(d) {
      return (new Date()) - d;
   };



   /********************************************************************
    ************************** Public methods **************************
    ********************************************************************/


   /**
    * Returns the underlying index.
    * @returns The index this queue is working on.
    * @type helma.Search.Index
    */
   this.getIndex = function() {
      return index;
   };

   /**
    * Returns the status of this manager.
    * @returns The status of this index manager.
    * @type Number
    */
   this.getStatus = function() {
      return status;
   };

   /**
    * Modifies the status of this manager, which has implications
    * on how objects are indexed (a/synchronous or queued).
    * @param {Number} s The new status of this manager.
    */
   this.setStatus = function(s) {
      status = s;
      return;
   };

   /**
    * Returns the underlying queue.
    * @returns The underlying queue.
    * @type jala.IndexManager.Queue
    */
   this.getQueue = function() {
      return queue;
   };

   /**
    * Returns the version number of the underlying index.
    * @returns The current version number of the underlying index.
    * @type Number
    */
   this.getCurrentIndexVersion = function() {
       try {
           return Packages.org.apache.lucene.index.IndexReader.getCurrentVersion(index.getDirectory());
       } catch (e) {
           app.logger.debug("Unable to determine the index version, reason: " + e);
       }
       return null;
   };

   /**
    * Returns true if the underlying index is currently optimized.
    * @returns True in case the index is optimized, false otherwise.
    * @type Boolean
    */
   this.hasOptimizingJob = function() {
      return queue.contains("optimize");
   };

   /**
    * Returns true if the index should be optimized. This is done by
    * comparing the version number of this IndexManager with the one of
    * the underlying index. If it exceeds IndexManager.OPTIMIZE_INTERVAL
    * the index needs to be optimized.
    */
   this.needsOptimize = function() {
       var indexVersion = this.getCurrentIndexVersion();
       if (indexVersion != null && (indexVersion - version) >= jala.IndexManager.OPTIMIZE_INTERVAL) {
           return true;
       }
       return false;
   };

   /**
    * Returns true if a worker has been initialized and it's still alive.
    * @returns True if a worker is running, false otherwise.
    * @type Boolean
    */
   this.hasWorker = function() {
      return (worker != null) ? worker.isAlive() : false;
   };
   
   /**
    * Returns true if the underlying index is currently rebuilding.
    * @returns True in case the index is rebuilding, false otherwise.
    * @type Boolean
    */
   this.isRebuilding = function() {
      return status == jala.IndexManager.REBUILDING;
   };

   /**
    * Flushes the underlying queue. This method should not be called
    * directly as it might run for a long time (depends on the length
    * of the queue). Instead this method will be executed asynchronously
    * after calling add(), remove() or optimize(). For safety reasons
    * every flush() will only run for a maximum time of 5 minutes, if
    * after that any objects are left in the queue a new asynchronous
    * thread will be started to continue processing the queue.
    */
   this.flush = function() {
      var start = new Date();
      var job;
      while ((job = queue.remove()) != null && getRuntime(start) < 300000) {
         app.logger.debug("IndexMgr.flush(): Job '" + job.action + "' has been in queue for "
                          + getRuntime(job.createtime) + " ms, processing now... (Thread "
                          + java.lang.Thread.currentThread().getId() + ", remaining jobs: "
                          + queue.size() + ")");
         try {
            switch (job.action) {
               case "add":
                  var proto = getGlobal(job._prototype);
                  var hopObj = proto.getById(job._id);
                  if (hopObj != null) {
                     this.add(hopObj, true);
                  } else {
                     log("Error during queue flush: " + job._prototype
                         + " with Id " + job._id + " doesn't exist.");
                  }
                  break;

               case "remove":
                  this.remove(job, true);
                  break;

               case "optimize":
                  this.optimize(true);
                  break;

               default:
                  log("Error during queue flush: unknown action " + job.action);
                  break;
            }
         } catch (e) {
            app.logger.debug("Exception during flush: " + e);
            if (job.errors < jala.IndexManager.MAXTRIES) {
               // got an error, so increment error counter and put back into queue
               job.errors += 1;
               this.addJob("add", job);
            } else {
               log("Error during queue flush: tried " + jala.IndexManager.MAXTRIES
                   + " times to handle " + job.action + " (job: " + job.toSource()
                   + ", giving up. Last error: " + e);
            }
         }
      }
      if (queue.size() > 0) {
         // there are still objects in the queue, so spawn a new worker
         this.startWorker(true);
      } else if (this.needsOptimize()) {
         // we're finished with flushing, but index needs an optimize
         // so add an optimizing job and start a new worker, but before
         // remove the reference to the worker to ensure that a new worker
         // is started (otherwise this worker would prevent the next
         // from starting).
         worker = null;
         this.optimize();
      }
      return;
   };
   
   
   /**
    * Adds a new job to the queue.
    * @param {String} action The action to perform. Currently
    * supported values are "add", "remove" and "optimize".
    * @param {Object} param An optional parameter object needed to
    * process the job.
    */
   this.addJob = function(action, param) {
      var key;
      if (param != null) {
         key = action + ":" + param._id;
         // add standard properties
         param.action = action;
         if (param.errors == undefined)
            param.errors = 0;
      } else {
         key = action;
         param = {action: action};
      }
      param.createtime = new Date();
      // add job to internal queue
      queue.add(key, param);
      return;
   };

   /**
    * Starts a new worker thread if there isn't already one
    * processing the queue. This method also checks if the
    * thread is actually dead.
    * @param {Boolean} force If true the worker is created regardless
    * whether there is one already or not. Use this option with caution
    * as it might lead to index corruption when two workers are processing
    * the same queue on the same index.
    */
   this.startWorker = function(force) {
      if (!this.hasWorker() || force === true) {
         worker = new jala.AsyncRequest(this, "flush");
         worker.evaluate();
      }
      return;
   };
   
   /**
    * Adds a HopObject to the underlying index. This is done
    * by adding a new job to the internal queue and starting
    * a new worker thread to process it (if there isn't already
    * a worker being busy processing the queue). Adding an object
    * to the index also means that all documents with the same Id will
    * be removed before. The HopObject must implement a method
    * <code>getIndexDocument</code> that is expected to return
    * a ready-to-index instance of helma.Search.Document.
    * @param {HopObject} obj The HopObject that should be indexed.
    * @param {Boolean} force (optional) If true the object will be added
    * instantly to the index without any check if the index is
    * locked or not, so use this option with caution. Normally this
    * option should never be set manually.
    * @see helma.Search.Document
    */
   this.add = function(obj, force) {
      if (force === true) {
         var start = new Date();
         var docObj;
         if (!(obj.getIndexDocument instanceof Function)) {
            log("Error during queue flush: " + param._prototype
                + " doesn't implement method getIndexDocument.");
         } else if (!(docObj = obj.getIndexDocument())) {
            log("Error during queue flush: coulnt't get index document for" 
                + param._prototype + " with Id " + param._id);
         } else {
            index.updateDocument(docObj, "id");
            log("Added " + obj._prototype + " with Id " + obj._id
                + " in " + getRuntime(start) + " ms");
         }
      } else {
         this.addJob("add", {
               _prototype: obj._prototype,
               _id: obj._id
            });
         log("Queued adding of " + obj._prototype + " with Id " + obj._id);
         if (!this.isRebuilding()) {
            this.startWorker();
         }
      }
      return;
   };

   /**
    * Removes the object passed as argument from the underlying
    * index. The argument can be either a HopObject or a JavaScript
    * object, but this method expects the property <code>_id</code>
    * to be set. Removing is done by adding a new job to the internal
    * queue, which in turn is processed asynchronously by a worker
    * thread.
    * @param {HopObject | Object} obj The HopObject or JavaScript object
    * whose property <code>_id</code> contains the Id of the index record.
    * @param {Boolean} force (optional) If true the removal is done instantly.
    * In this case no checking is done if the index is locked, so use
    * this option with caution as it might lead to index corruption.
    */
   this.remove = function(obj, force) {
      if (force === true) {
         var start = new Date();
         index.removeDocument("id", obj._id);
         log("Removed Id " + obj._id + " from index in "
             + getRuntime(start) + " ms");
      } else {
         this.addJob("remove", {
            _prototype: obj._prototype,
            _id: obj._id
         });
         log("Queued removal of " + obj._prototype + " with Id " + obj._id);
         if (!this.isRebuilding()) {
            this.startWorker();
         }
      }
      return;
   };

   /**
    * Optimizes the underlying index. Optimizing is done asynchronously,
    * so this method returns immediately, but the job itself will be
    * processed as soon as possible. Calling this method multiple times
    * doesn not lead to multiple optimization, as the job cannot be
    * added to the queue if there is already one.
    * @param {Boolean} force If true the index is optimized
    * immediately, without any check whether the index is locked
    * or not, so use this option with caution.
    * @see #isOptimized()
    */
   this.optimize = function(force) {
      if (force === true) {
         var start = new Date();
         index.optimize();
         // update version number to current index version
         version = this.getCurrentIndexVersion();
         log("Optimized index in " + getRuntime(start) + " ms");
      } else {
         this.addJob("optimize");
         log("Queued index optimizing");
         if (!this.isRebuilding()) {
            this.startWorker();
         }
      }
      return;
   };

   /**
    * Returns an Array containing objects, where each one
    * contains information about an index segment in two
    * properties: "name" is the file name of the segment,
    * and "docCount" contains the number of documents in
    * this segment.
    * @returns An Array containing segment informations.
    * @type Array
    */
   this.getSegmentInfos = function() {
      var FORMAT = -1;
      var infos = [];
      var directory = index.getDirectory();
      var input = directory.openInput("segments");
      var format, version, counter;

      try {
         format = input.readInt();
         if (format < 0){     // file contains explicit format info
            // check that it is a format we can understand
            if (format < FORMAT)
               throw ("Unknown format version: " + format);
            version = input.readLong(); // read version
            counter = input.readInt(); // read counter
         } else {     // file is in old format without explicit format info
            counter = format;
         }
      
         for (var i=input.readInt(); i>0; i--) { // read segmentInfos
            infos.push({name: input.readString(),
                        docCount: input.readInt()});
         }
      
         if (format >= 0) {    // in old format the version number may be at the end of the file
            if (input.getFilePointer() >= input.length())
               version = 0; // old file format without version number
            else
               version = input.readLong(); // read version
         }
      } catch (e) {
         app.logger.debug("Unable to retrieve segment infos, reason: " + e);
      } finally {
         input.close();
      }
      return infos;
   };
   
   /** @ignore */
   this.toString = function() {
      return "[Index Manager '" + this.name + "' ("
             + queue.size() + " objects queued)]";
   };

   /**
    * The name of the index this queue is responsible for,
    * which equals the name of the directory the underlying
    * index resides in.
    * @type String
    */
   this.name = name;

   /**
    * Main constructor body. Initializes the underlying index.
    */
   var search = new helma.Search();
   var analyzer = helma.Search.getAnalyzer(lang);
   var fsDir = search.getDirectory(new helma.File(dir, name));
   index = search.createIndex(fsDir, analyzer);
   log("Created/mounted " + index);

   return this;
};

/**
 * Constant defining the maximum number of tries to add/remove
 * an object to/from the underlying index.
 * @type Number
 * @final
 */
jala.IndexManager.MAXTRIES = 3;

/**
 * Constant defining the number of changes in the underlying
 * index before it should be optimized.
 * @type Number
 * @final
 */
jala.IndexManager.OPTIMIZE_INTERVAL = 1000;

/**
 * Constant defining normal mode of this index manager.
 * @type Number
 * @final
 */
jala.IndexManager.NORMAL = 1;

/**
 * Constant defining rebuilding mode of this index manager.
 * @type Number
 * @final
 */
jala.IndexManager.REBUILDING = 2;


/**
 * Creates new Queue instances.
 * @class Instances of this class are a mixture between a
 * first-in-first-out (FIFO) queue and a map, which means objects
 * are added using a string key and the value that should be associated
 * with it at the beginning of the queue, while maintaining the
 * order of insertion. Calling remove on the other hand removes the
 * last element in the queue, removes the key and returns the
 * value associated with it.
 * @constructor
 */
jala.IndexManager.Queue = function() {
   var values = [];
   var keys = {};

   /**
    * Adds the object passed as argument to the queue,
    * using the given key.
    * @param {String} key The key to use for storing the object.
    * @param {Object} obj The object to store in the queue
    * @returns The length of the queue after the insertion.
    * @type Number
    */
   this.add = function(key, obj) {
      if (!this.contains(key)) {
         keys[key] = values.unshift({key: key, obj: obj});
      }
      return values.length;
   };
   
   /**
    * Returns true if the key is used in this queue.
    * @param {String} key The key to check.
    * @returns True in case there is an object in this
    * queue using this key, false otherwise.
    * @type Boolean
    */
   this.contains = function(key) {
      return keys[key] != null;
   };
   
   /**
    * Removes the last element in the queue and returns it.
    * @returns The last element in the queue.
    */
   this.remove = function() {
      if (values.length > 0) {
         var result = values.pop();
         delete keys[result.key];
         return result.obj;
      }
      return null;
   };
   
   /**
    * Returns the last element in the queue without removing
    * it, so in contrast to remove() this method does not
    * change the length of the queue.
    * @returns The last element in the queue.
    */
   this.peek = function() {
      if (values.length > 0) {
         return values[0].obj;
      }
      return null;
   };
   
   /**
    * Returns the current length of the queue.
    * @returns The length of the queue.
    * @type Number
    */
   this.size = function() {
      return values.length;
   };
   
   return this;
};
