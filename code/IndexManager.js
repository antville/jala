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
 * Jala dependencies
 */
app.addRepository(getProperty("jala.dir", "modules/jala") + 
                  "/code/AsyncRequest.js");

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
 * @see helma.Search.createIndex
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
    * Synchronized linked list that functions as a queue for
    * asynchronous processing of index manipulation jobs.
    * @type java.util.LinkedList
    * @private
    * @see jala.IndexManager.Job
    */
   var queue = java.util.Collections.synchronizedList(new java.util.LinkedList());

   /**
    * Private variable containing the worker flushing the queue
    * @type jala.AsyncRequest
    * @private
    */
   var worker = null;

   /**
    * Private property holding the version number of the underlying index
    * (see org.apache.lucene.index.IndexReader.getCurrentVersion()).
    * This is used to determine if the index should be optimized.
    * @type Number
    * @private
    * @see #needsOptimize
    */
   var version = 0;

   /**
    * Returns the underlying index.
    * @returns The index this queue is working on.
    * @type helma.Search.Index
    */
   this.getIndex = function() {
      return index;
   };

   /**
    * Returns the current version of this index manager
    * @returns The current version of this index manager
    * @type Number 
    */
   this.getVersion = function() {
      return version;
   };

   /**
    * Returns the status of this manager.
    * @returns The status of this index manager.
    * @type Number
    * @see #NORMAL
    * @see #REBUILDING
    */
   this.getStatus = function() {
      return status;
   };

   /**
    * Modifies the status of this manager, which has implications
    * on how index modifying jobs are handled. If the status
    * is {@link #REBUILDING}, all jobs are queued until the status
    * is set back to {@link #NORMAL}.
    * @param {Number} s The new status of this manager.
    * @see #NORMAL
    * @see #REBUILDING
    */
   this.setStatus = function(s) {
      status = s;
      return;
   };

   /**
    * Returns the queue this index manager is using.
    * @returns The queue.
    * @type java.util.LinkedList
    */
   this.getQueue = function() {
      return queue;
   };

   /**
    * Returns the name of the index manger, which
    * is equal to the name of the underlying index
    * @returns The name of the index manager
    * @type String
    */
   this.getName = function() {
      return name;
   };

   /**
    * Returns true if the underlying index is currently optimized.
    * @returns True in case the index is optimized, false otherwise.
    * @type Boolean
    */
   this.hasOptimizingJob = function() {
      for (var i=0; i<queue.size(); i++) {
         if (queue.get(i).type == jala.IndexManager.Job.OPTIMIZE) {
            return true;
         }
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
    * Updates the internal version property of this index manager
    * to the current version of the underlying index.
    */
   this.updateVersion = function() {
      version = this.getCurrentIndexVersion();
      return;
   };

   /**
    * Starts a new worker thread if there isn't already one
    * processing the queue. This method also checks if the
    * thread is actually dead.
    * @param {Boolean} force If true the worker is created regardless
    * whether there is one already or not.
    * @private
    */
   this.startWorker = function(force) {
      if (force === true || !this.hasWorker()) {
         app.logger.debug("IndexManager '" + this.getName() +
                          "': creating new worker");
         worker = new jala.AsyncRequest(this, "flush");
         worker.evaluate();
      }
      return;
   };
   
   /**
    * Main constructor body. Initializes the underlying index.
    */
   var search = new helma.Search();
   var analyzer = helma.Search.getAnalyzer(lang);
   var fsDir = search.getDirectory(new helma.File(dir, name));
   index = search.createIndex(fsDir, analyzer);
   // initialize the version
   this.updateVersion();
   app.logger.info("IndexManager '" + this.getName() +
                   "': created/mounted " + index);

   return this;
};

/**
 * Constant defining the maximum number of tries to add/remove
 * an object to/from the underlying index.
 * @type Number
 * @final
 */
jala.IndexManager.MAXTRIES = 10;

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
 * Static helper method that returns the value of the "id"
 * field of a document object.
 * @param {helma.Search.Document} doc The document whose id
 * should be returned.
 * @private
 */
jala.IndexManager.getDocumentId = function(doc) {
   try {
      return doc.getField("id").value;
   } catch (e) {
      // ignore
   }
   return null;
};

/**
 * Returns the milliseconds elapsed between the current timestamp
 * and the one passed as argument.
 * @returns The elapsed time in millis.
 * @type Number
 * @private
 */
jala.IndexManager.getRuntime = function(d) {
   return (new Date()) - d;
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
jala.IndexManager.prototype.getSegmentInfos = function() {
   var FORMAT = -1;
   var infos = [];
   var directory = this.getIndex().getDirectory();
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
jala.IndexManager.prototype.toString = function() {
   var queue = this.getQueue();
   return "[Index Manager '" + this.getName() + "' (" +
          queue.size() + " objects queued)]";
};

/**
 * Adds a document object to the underlying index. This is done
 * by adding a new job to the internal queue and starting
 * a new worker thread to process it (if there isn't already
 * a worker being busy processing the queue). Adding an object
 * to the index also means that all documents with the same Id will
 * be removed before.
 * @param {helma.Search.Document} doc The document object that should be
 * added to the underlying index.
 * @param {Boolean} force (optional) If true the object will be added
 * instantly to the index without any check if the index is
 * locked or not, so use this option with caution. Normally this
 * option should never be set manually.
 * @see helma.Search.Document
 */
jala.IndexManager.prototype.add = function(doc, force) {
   if (force === true) {
      var start = new Date();
      this.getIndex().updateDocument(doc, "id");
      app.logger.debug("IndexManager '" + this.getName() +
                       "': added document with Id " +
                       jala.IndexManager.getDocumentId(doc) +
                       " in " + jala.IndexManager.getRuntime(start) + " ms");
   } else {
      if (!doc) {
         app.logger.error("IndexManager '" + this.getName() +
                          "': missing document object to add");
      } else {
         var job = new jala.IndexManager.Job(jala.IndexManager.Job.ADD,
                                             doc);
         this.getQueue().add(job);
         app.logger.debug("IndexManager '" + this.getName() +
                          "': queued adding document " + job.getId() + " to index");
         if (!this.isRebuilding()) {
            this.startWorker();
         }
      }
   }
   return;
};

/**
 * Removes all entries with the Id passed as argument from the
 * underlying index. Removing is done by adding a new job to the internal
 * queue, which in turn is processed asynchronously by a worker
 * thread.
 * @param {Number} id The Id of the document object(s) to remove
 * from the underlying index.
 * @param {Boolean} force (optional) If true the removal is done instantly.
 * In this case no checking is done if the index is locked, so use
 * this option with caution as it might lead to index corruption.
 */
jala.IndexManager.prototype.remove = function(id, force) {
   if (force === true) {
      var start = new Date();
      this.getIndex().removeDocument("id", id);
      app.logger.debug("IndexManager '" + this.getName() +
                       "': removed document with Id " + id +
                       " from index in " + jala.IndexManager.getRuntime(start) +
                       " ms");
   } else {
      id = parseInt(id, 10);
      if (isNaN(id)) {
         app.logger.error("IndexManager '" + this.getName() +
                          "': missing or invalid document id to remove");
      } else {
         var job = new jala.IndexManager.Job(jala.IndexManager.Job.REMOVE, id);
         this.getQueue().add(job);
         app.logger.debug("IndexManager '" + this.getName() +
                          "': queued removal of document with Id " + id);
         if (!this.isRebuilding()) {
            this.startWorker();
         }
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
 * @see #needsOptimize()
 */
jala.IndexManager.prototype.optimize = function(force) {
   if (force === true) {
      var start = new Date();
      this.getIndex().optimize();
      // update version number to current index version
      this.updateVersion();
      app.logger.info("IndexManager '" + this.getName() +
                      "': optimized index in " + jala.IndexManager.getRuntime(start) +
                      " ms");
   } else {
      var job = new jala.IndexManager.Job(jala.IndexManager.Job.OPTIMIZE);
      this.getQueue().add(job);
      app.logger.debug("IndexManager '" + this.getName() +
                       "': queued index optimization");
      if (!this.isRebuilding()) {
         this.startWorker();
      }
   }
   return;
};

/**
 * Returns the version number of the underlying index.
 * @returns The current version number of the underlying index.
 * @type Number
 */
jala.IndexManager.prototype.getCurrentIndexVersion = function() {
   var dir = this.getIndex().getDirectory();
   try {
      return Packages.org.apache.lucene.index.IndexReader.getCurrentVersion(dir);
   } catch (e) {
      app.logger.debug("IndexManager '" + this.getName() +
                       "': unable to determine the index version, reason: " + e);
   }
   return null;
};

/**
 * Returns true if the index should be optimized. This is done by
 * comparing the version number of this IndexManager with the one of
 * the underlying index. If it exceeds IndexManager.OPTIMIZE_INTERVAL
 * the index needs to be optimized.
 * @returns True in case the underlying should be optimized, false
 * otherwise
 * @type Boolean
 */
jala.IndexManager.prototype.needsOptimize = function() {
   var version = this.getVersion();
   var indexVersion = this.getCurrentIndexVersion();
   if (indexVersion != null &&
      (indexVersion - version) >= jala.IndexManager.OPTIMIZE_INTERVAL) {
      return true;
   }
   return false;
};

/**
 * Flushes the underlying queue. This method should not be called
 * directly as it might run for a long time (depends on the length
 * of the queue). Instead this method will be executed asynchronously
 * after calling add(), remove() or optimize(). For safety reasons
 * every flush() will only run for a maximum time of 5 minutes, if
 * after that any objects are left in the queue a new asynchronous
 * thread will be started to continue processing the queue.
 * @private
 */
jala.IndexManager.prototype.flush = function() {
   var queue = this.getQueue();
   var start = new Date();
   var job;
   while (!queue.isEmpty() && jala.IndexManager.getRuntime(start) < 300000) {
      job = queue.remove(0);
      app.logger.debug("IndexManager '" + this.getName() +
                       "': " + job.type + " job with Id " + job.getId() +
                       " has been in queue for " + jala.IndexManager.getRuntime(job.createtime) +
                       " ms, processing now... (Thread " + java.lang.Thread.currentThread().getId() +
                       ", remaining jobs: " + queue.size() + ")");
      try {
         switch (job.type) {
            case jala.IndexManager.Job.ADD:
               this.add(job.data, true);
               break;

            case jala.IndexManager.Job.REMOVE:
               this.remove(job.data, true);
               break;

            case jala.IndexManager.Job.OPTIMIZE:
               this.optimize(true);
               break;

            default:
               app.logger.error("IndexManager '" + this.getName() +
                                "': error during queue flush, unknown job type " +
                                job.type);
               break;
         }
      } catch (e) {
         app.logger.debug("Exception during flush: " + e);
         if (job.errors < jala.IndexManager.MAXTRIES) {
            // got an error, so increment error counter and put back into queue
            job.errors += 1;
            queue.add(job);
         } else {
            app.logger.error("IndexManager '" + this.getName() +
                             "': error during queue flush: tried " +
                             jala.IndexManager.MAXTRIES + " times to handle " +
                             job.type + " (Id: " + job.getId() +
                             ", giving up. Last error was: " + e);
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
      queue.add(new jala.IndexManager.Job(jala.IndexManager.Job.OPTIMIZE));
      this.startWorker(true);
   }
   return;
};

/**
 * Creates a new Job instance.
 * @class Instances of this class represent a single index
 * manipulation job to be processed by the index manager.
 * @param {Number} type The type of job, which can be either
 * jala.IndexManager.Job.ADD, jala.IndexManager.Job.REMOVE
 * or jala.IndexManager.Job.OPTIMIZE.
 * @param {Object} data The data needed to process the job.
 * @returns A newly created Job instance.
 * @constructor
 * @see jala.IndexManager.Job
 */
jala.IndexManager.Job = function(type, data) {
   /**
    * The type of the job
    * @type Number
    */
   this.type = type;

   /**
    * The data needed to process this job. For adding jobs this property
    * must contain the {@link helma.Search.Document} instance to add to
    * the index. For removal job this property must contain the unique identifier
    * of the document that should be removed from the index. For optimizing
    * jobs this property is null.
    */
   this.data = data;

   /**
    * An internal error counter which is increased whenever processing
    * the job failed.
    * @type Number
    * @see jala.IndexManager.MAXTRIES
    */
   this.errors = 0;
   
   /**
    * The date and time at which this job was created.
    * @type Date
    */
   this.createtime = new Date();

   return this;
};

/** @ignore */
jala.IndexManager.Job.prototype.toString = function() {
   return "[Index Job]";
};

/**
 * Returns the Id of the job. For adding jobs, this returns the
 * Id of the document object, for removal jobs the Id to remove
 * from the index. For optimizing jobs this method returns null.
 * @returns The Id of the job
 * @type String
 */
jala.IndexManager.Job.prototype.getId = function() {
   switch (this.type) {
      case jala.IndexManager.Job.REMOVE:
         return this.data;
      case jala.IndexManager.Job.ADD:
         return jala.IndexManager.getDocumentId(this.data);
      default:
         break;
   }
   return null;
};

/**
 * Constant defining an add job
 * @type Number
 * @final
 */
jala.IndexManager.Job.ADD = "add";

/**
 * Constant defining a removal job
 * @type Number
 * @final
 */
jala.IndexManager.Job.REMOVE = "remove";

/**
 * Constant defining an optimizing job
 * @type Number
 * @final
 */
jala.IndexManager.Job.OPTIMIZE = "optimize";

