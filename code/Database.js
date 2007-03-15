/**
 * @fileoverview Fields and methods of the jala.db package.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}

/**
 * HelmaLib dependencies
 */
app.addRepository("modules/helma/Database.js");

/**
 * Namespace declaration
 */
jala.db = {};

/**
 * Static helper method that converts the object passed as argument
 * to a connection property string.
 * @param {Object} props The property object to convert
 * @returns A connection property string
 * @type String
 * @private
 */
jala.db.getPropertyString = function(props) {
   if (props != null) {
      res.push();
      for (var i in props) {
         res.write(";");
         res.write(i);
         res.write("=");
         res.write(props[i]);
      }
      return res.pop();
   }
   return null;
}



/*****************************************
 ***   D A T A B A S E   S E R V E R   ***
 *****************************************/


/**
 * Returns a new Server instance.
 * @class Instances of this class represent a <a href="http://hsqldb.org/">HSQLDB</a>
 * database server hosting up to 10 separate databases, which are accessible via network.
 * <br /><strong>Important:</strong> You need the hsqldb.jar in lib/ext
 * of your helma installation for this library to work, which you can get
 * at <a href="http://hsqldb.org/">http://hsqldb.org/</a>.
 * @param {String|Number} address Either the IP address or the port number or a combination
 * of both in the form "ip:port". By default the IP address is "127.0.0.1" (aka localhost)
 * and the port is 9001.
 * @returns A newly created Server instance
 * @constructor
 * @see <a href="http://hsqldb.org/">http://hsqldb.org/</a>
 */
jala.db.Server = function(address) {

   /**
    * Private variable containing the hsqldb server instance
    * @type Packages.org.hsqldb.Server
    * @private
    */
   var server = new Packages.org.hsqldb.Server();

   /**
    * Private array containing the databases within this server.
    * The index position of a database in this array corresponds
    * to the index position within the wrapped server.
    * @private
    */
   var databases = [];

   /**
    * Map containing the names of databases pointing
    * to the index of the database within the server
    * @private
    */
   var names = {};

   /**
    * Returns the wrapped database server instance
    * @returns The wrapped database server
    * @type org.hsqldb.Server
    * @private
    */
   this.getServer = function() {
      return server;
   };

   /**
    * Returns the database with the given name.
    * @param {String} name The name of the database to return
    * @returns The database with the given name
    * @type jala.db.RamDatabase|jala.db.FileDatabase
    * @private
    */
   this.getDatabase = function(name) {
      var dbIdx;
      if ((dbIdx = names[name]) != null) {
         return databases[dbIdx];
      }
      return null;
   };

   /**
    * Returns the map containing the database names registered
    * within this server instance.
    * @returns A map containing the database names as properties which
    * value is the index position of the database within this server
    * @type Object
    * @private
    */
   this.getDatabaseMap = function() {
      return names;
   };

   /**
    * Returns an array containing all databases within this server.
    * @returns All databases within this server
    * @type Array
    * @private
    */
   this.getDatabases = function() {
      return databases;
   };

   /**
    * Main constructor body
    */
   var ip = "127.0.0.1";
   var port = 9001;
   if (address != null) {
      if (address.indexOf(":") > -1) {
         ip = address.substring(0, address.indexOf(":"));
         port = parseInt(address.substring(address.indexOf(":") + 1), 10);
      } else if (!isNaN(address)) {
         port = parseInt(address, 10);
      }
   }
   // set the IP address and the port this server should listen on
   server.setAddress(ip);
   server.setPort(port);
   app.logger.info("Jala : created instance listening on " + ip + ":" + port);
   return this;
};

/** @ignore */
jala.db.Server.prototype.toString = function() {
   return "[Jala Database Server]";
};

/**
 * Starts the database server. This should be called after all databases
 * have been added.
 * @see #addDatabase
 */
jala.db.Server.prototype.start = function() {
   var server = this.getServer();
   server.setLogWriter(null);
   server.setErrWriter(null);
   server.start();
   return;
};

/**
 * Stops the database server.
 */
jala.db.Server.prototype.stop = function() {
   var server = this.getServer();
   server.stop();
   return;
};

/**
 * Returns true if the database server is running.
 * @returns True if the database server is running
 * @type Boolean
 */
jala.db.Server.prototype.isRunning = function() {
   return this.getServer().getState() == Packages.org.hsqldb.ServerConstants.SERVER_STATE_ONLINE;
};

/**
 * Adds a database to this server.
 * @param {jala.db.RamDatabase|jala.db.FileDatabase} db The database to add
 * @param {Object} props An optional parameter object containing database
 * properties
 */
jala.db.Server.prototype.addDatabase = function(db, props) {
   if (!(db instanceof jala.db.RamDatabase)) {
      throw "jala.db.Server: Invalid argument to addDatabase(): " + db;
   }
   var name = db.getName();
   var map = this.getDatabaseMap();
   if (map[name] != null) {
      throw "jala.db.Server: There is already a database registered with the name '" +
             name + "'";
   }
   var server = this.getServer();
   var databases = this.getDatabases();
   var dbIdx = databases.length;
   var dbPath = db.getDatabasePath();
   dbPath += ";sql.enforce_strict_size=true";
   if (props != null) {
      dbPath += jala.db.getPropertyString(props);
   }
   this.getDatabaseMap()[name] = dbIdx;
   this.getDatabases()[dbIdx] = db;
   // add the database to the server
   server.setDatabaseName(dbIdx, name);
   server.setDatabasePath(dbIdx, dbPath);
   return;
};

/**
 * Returns the JDBC Url to use for connections to the
 * specified database.
 * @param {String} name An optional name of a database running
 * @param {Object} props Optional connection properties to add
 * @returns The JDBC Url to use for connecting to a database
 * within this sever
 * @type String
 */
jala.db.Server.prototype.getUrl = function(name, props) {
   res.push();
   res.write("jdbc:hsqldb:hsql://localhost:");
   res.write(this.getServer().getPort());
   res.write("/");
   if (name != null) {
      res.write(name);
   }
   res.write(jala.db.getPropertyString(props))
   return res.pop();
};

/**
 * Returns a properties object containing the connection properties
 * of the database with the given name.
 * @param {String} name The name of the database
 * @param {Object} props An optional parameter object containing
 * connection properties to add to the connection Url.
 * @returns A properties object containing the connection properties
 * @type helma.util.ResourceProperties
 */
jala.db.Server.prototype.getProperties = function(name, props) {
   var rp = new Packages.helma.util.ResourceProperties();
   rp.put(name + ".url", this.getUrl(name, props));
   rp.put(name + ".driver", "org.hsqldb.jdbcDriver");
   rp.put(name + ".user", "sa");
   rp.put(name + ".password", "");
   return rp;
};

/**
 * Returns a connection to a database within this server.
 * @param {String} name The name of the database running
 * within this server
 * @param {Object} props An optional parameter object
 * containing connection properties to add to the connection Url.
 * @returns A connection to the specified database
 * @type helma.Database
 */
jala.db.Server.prototype.getConnection = function(name, props) {
   var rp = this.getProperties(name, props);
   var dbSource = new Packages.helma.objectmodel.db.DbSource(name, rp);
   return new helma.Database(dbSource);
};



/*****************************
 ***   D A T A   T Y P E   ***
 *****************************/


/**
 * Returns a newly created DataType instance.
 * @class Instances of this class represent a data type. Each instance
 * contains the code number as defined in java.sql.Types, the name of
 * the data type as defined in java.sql.Types and optional creation parameters
 * allowed for this data type.
 * @param {Number} type The sql code number of this data type
 * @param {String} typeName The type name of this data type, as used within sql statements
 * @param {String} params Optional creation parameters allowed for this data type.
 * @returns A newly created instance of DataType.
 * @constructor
 */
jala.db.DataType = function(type, typeName, params) {

   /**
    * Returns the sql type code number as defined in java.sql.Types
    * @returns The sql type code number of this data type
    * @type Number
    */
   this.getType = function() {
      return type;
   };

   /**
    * Returns the type name of this data type, which can be
    * used in sql queries.
    * @returns The type name of this data type
    * @type String
    */
   this.getTypeName = function() {
      return typeName;
   };

   /**
    * Returns the creation parameter string of this data type
    * @returns The creation parameter string of this data type
    * @type String
    */
   this.getParams = function() {
      return params;
   };
   
   /** @ignore */
   this.toString = function() {
      return "[DataType " +
             " CODE: " + code +
             ", SQL: " + sqlType +
             ", PARAMS: " + params + "]";
   };

   return this;
};

/**
 * Returns true if values for this data type should be surrounded
 * by (single) quotes.
 * @returns True if values for this data type should be surrounded
 * by quotes, false if not
 * @type Boolean
 */
jala.db.DataType.prototype.needsQuotes = function() {
   switch (this.getType()) {
      case java.sql.Types.CHAR:
      case java.sql.Types.VARCHAR:
      case java.sql.Types.LONGVARCHAR:
      case java.sql.Types.BINARY:
      case java.sql.Types.VARBINARY:
      case java.sql.Types.LONGVARBINARY:
      case java.sql.Types.DATE:
      case java.sql.Types.TIME:
      case java.sql.Types.TIMESTAMP:
         return true;
      default:
         return false;
   }
};



/***********************************
 ***   R A M   D A T A B A S E   ***
 ***********************************/


/**
 * Returns a newly created RamDatabase instance.
 * @class Instances of this class represent an in-memory sql database.
 * <br /><strong>Important:</strong> You need the hsqldb.jar in lib/ext
 * of your helma installation for this library to work, which you can get
 * at <a href="http://hsqldb.org/">http://hsqldb.org/</a>.
 * @param {String} name The name of the database
 * @returns A newly created instance of RamDatabase
 * @constructor
 */
jala.db.RamDatabase = function(name) {

   /**
    * Returns the name of the database
    * @returns The name of the database
    * @type String
    */
   this.getName = function() {
      return name;
   };

   return;
};

/** @ignore */
jala.db.RamDatabase.prototype.toString = function() {
   return "[Jala RamDatabase " + this.getName() + "]";
}

/**
 * Returns the JDBC Url to connect to this database
 * @param {Object} props Optional connection properties to add
 * @returns The JDBC url to use for connecting to this database
 * @type String
 */
jala.db.RamDatabase.prototype.getUrl = function(props) {
   var url = "jdbc:hsqldb:" + this.getDatabasePath();
   if (props != null) {
      url += jala.db.getPropertyString(props);
   }
   return url;
};

/**
 * Returns the path of this database, which is used by jala.db.Server
 * when adding the database to its set of hosted databases.
 * @returns The path of this database within a server instance
 * @type String
 * @private
 */
jala.db.RamDatabase.prototype.getDatabasePath = function() {
   return "mem:" + this.getName();
}

/**
 * Returns a properties object containing the connection properties
 * for this database.
 * @param {Object} props An optional parameter object containing
 * connection properties to add to the connection Url.
 * @returns A properties object containing the connection properties
 * @type helma.util.ResourceProperties
 */
jala.db.RamDatabase.prototype.getProperties = function(props) {
   var name = this.getName();
   var rp = new Packages.helma.util.ResourceProperties();
   rp.put(name + ".url", this.getUrl(props));
   rp.put(name + ".driver", "org.hsqldb.jdbcDriver");
   rp.put(name + ".user", "sa");
   rp.put(name + ".password", "");
   return rp;
};

/**
 * Returns a connection to this database
 * @param {Object} An optional parameter object containing connection
 * properties to add to the connection Url.
 * @returns A connection to this database
 * @type helma.Database
 */
jala.db.RamDatabase.prototype.getConnection = function(props) {
   var name = this.getName();
   var rp = this.getProperties(props);
   var dbSource = new Packages.helma.objectmodel.db.DbSource(name, rp);
   return new helma.Database(dbSource);
};

/**
 * Stops this in-process database by issueing a "SHUTDOWN" sql command.
 */
jala.db.RamDatabase.prototype.shutdown = function() {
   var conn = this.getConnection();
   conn.execute("SHUTDOWN");
   return;
};

/**
 * Creates a table in this database.
 * @param {String} name The name of the table
 * @param {Array} columns The columns to create in the table. Each column
 * must be described using an object containing the following properties:
 * <ul>
 * <li>name (String): The name of the column</li>
 * <li>type (Number): The type of the column as defined in java.sql.Types</li>
 * <li>nullable (Boolean): If true the column may contain null values (optional, defaults to true)</li>
 * <li>length (Number): The maximum length of the column (optional)</li>
 * <li>precision (Number): The precision to use (optional)</li>
 * <li>unique (Boolean): If true the column may only contain unique values (optional, defaults to false)</li>
 * <li>default (Object): The default value to use (optional)</li>
 * </ul>
 * @param {String} primaryKey The name of the column that contains
 * the primary key
 */
jala.db.RamDatabase.prototype.createTable = function(tableName, columns, primaryKey) {
   res.push();
   res.write("CREATE TABLE ");
   res.write(tableName);
   res.write(" (");
   var column, dataType, params;
   for (var i=0;i<columns.length;i++) {
      column = columns[i];
      res.write(column.name);
      res.write(" ");
      dataType = this.getDataType(column.type);
      if (!dataType) {
         throw "Unable to determine data type, code: " + column.type;
      }
      res.write(dataType.getTypeName());
      if ((params = dataType.getParams()) != null) {
         var arr = [];
         switch (params.toLowerCase()) {
            case "length":
               if (column.length) {
                  arr.push(column.length);
               }
               break;
            case "precision":
               if (column.precision) {
                  arr.push(column.precision);
               }
               break;
            case "precision,scale":
               if (column.precision) {
                  arr.push(column.precision);
               }
               if (column.scale) {
                  arr.push(column.scale);
               }
               break;
         }
         if (arr.length > 0) {
            res.write("(");
            res.write(arr.join(","));
            res.write(")");
         }
      }
      if (column["default"]) {
         res.write(" DEFAULT ");
         if (dataType.needsQuotes() === true) {
            res.write("'");
            res.write(column["default"]);
            res.write("'");
         } else {
            res.write(column["default"]);
         }
      }
      if (column.nullable === false) {
         res.write(" NOT NULL");
      }
      if (i < columns.length - 1) {
         res.write(", ");
      }
   }
   if (primaryKey != null) {
      res.write(", PRIMARY KEY (");
      if (primaryKey instanceof Array) {
         res.write(primaryKey.join(", "));
      } else {
         res.write(primaryKey);
      }
      res.write(")");
   }
   res.write(")");
   var sql = res.pop();
   try {
      var conn = this.getConnection();
      conn.execute(sql);
      app.logger.info("Successfully created table " + tableName);
      app.logger.debug("Sql statement used: " + sql);
      return true;
   } catch (e) {
      app.logger.error("Unable to create table " + tableName + ", reason: " + e);
      return false;
   }
};

/**
 * Drops the table with the given name
 * @param {String} tableName The name of the table
 * @returns True if the table was successfully dropped, false otherwise
 * @type Boolean
 */
jala.db.RamDatabase.prototype.dropTable = function(tableName) {
   var conn = this.getConnection();
   var sql = "DROP TABLE " + tableName;
   conn.execute(sql);
   return;
};

/**
 * Returns true if the table exists already in the database
 * @param {String} name The name of the table
 * @returns True if the table exists, false otherwise
 * @type Boolean
 */
jala.db.RamDatabase.prototype.tableExists = function(name) {
   var conn = this.getConnection().getConnection();
   var meta = conn.getMetaData();
   var t = meta.getTables(null, "PUBLIC", "%", null);
   var tableName;
   try {
      while (t.next()) {
         tableName = t.getString(3).toUpperCase();
         if (tableName.toLowerCase() === name.toLowerCase()) {
            return true;
         }
      }
      return false;
   } finally {
      if (t != null) {
         t.close();
      }
      if (conn != null) {
         conn.close();
      }
   }
};

/**
 * Copies all tables in the database passed as argument into this embedded database.
 * If any of the tables already exists in this database, they will be removed before
 * re-created. Please mind that this method ignores any indexes in the source database,
 * but respects the primary key settings.
 * @param {helma.Database} database The database to copy the tables from
 */
jala.db.RamDatabase.prototype.copyTables = function(database) {
   // retrieve the metadata for all tables in this schema
   try {
      var conn = database.getConnection();
      var meta = conn.getMetaData();
      var t = meta.getTables(null, "%", "%", null);
      var tableName, columns;
      while (t.next()) {
         tableName = t.getString(3).toUpperCase();
         if (this.tableExists(tableName)) {
            this.dropTable(tableName);
         }
         // create an array containing the necessary column metadata
         var columns = [];
         var c = meta.getColumns(null, "%", tableName, "%");
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
         var pk = meta.getPrimaryKeys(null, "%", tableName);
         var keys = [];
         while (pk.next()) {
            keys[keys.length] = pk.getString(4);
         }
         // create the table in the embedded database
         this.createTable(tableName, columns, keys.length > 0 ? keys : null);
      }
   } finally {
      if (t != null) {
         t.close();
      }
      if (conn != null) {
         conn.close();
      }
   }
   return;
};

/**
 * Returns an array containing all available data types.
 * @returns All available data types
 * @type Array
 * @see jala.db.DataType
 */
jala.db.RamDatabase.prototype.getDataTypes = function() {
   // data types are cached for performance reasons
   if (!arguments.callee.cache) {
      // java.sql data types
      arguments.callee.cache = [];
      var con = this.getConnection().getConnection();
      var meta = con.getMetaData();
      var rs = meta.getTypeInfo();
      var code, name, params;
      while (rs.next()) {
         code = rs.getInt("DATA_TYPE");
         name = rs.getString("TYPE_NAME");
         params = rs.getString("CREATE_PARAMS");
         arguments.callee.cache.push(new jala.db.DataType(code, name, params));
      }
   }
   return arguments.callee.cache;
};

/**
 * Returns the data type for the code passed as argument
 * @param {Number} type The type code as defined in java.sql.Types
 * @returns The data type object for the code
 * @type jala.db.DataType
 */
jala.db.RamDatabase.prototype.getDataType = function(type) {
   var types = this.getDataTypes();
   var dataType;
   for (var i=0;i<types.length;i++) {
      dataType = types[i];
      if (dataType.getType() === type) {
         return dataType;
      }
   }
   return null;
};

/**
 * Runs the script file passed as argument in the context of this database.
 * Use this method to eg. create and/or populate a database.
 * @param {helma.File} file The script file to run.
 */
jala.db.RamDatabase.prototype.runScript = function(file) {
   try {
      var sqlFile = new Packages.org.hsqldb.util.SqlFile(new java.io.File(file), false, new java.util.HashMap());
      var conn = this.getConnection().getConnection();
      sqlFile.execute(conn, false);
      app.logger.info("Jala Database: successfully executed SQL script '" + file.getAbsolutePath() + "'");
      return true;
   } catch (e) {
      app.logger.error("Jala Database: executing SQL script failed, reason: " + e);
      return false;
   } finally {
      if (conn != null) {
         conn.close();
      }
   }
};



/*************************************
 ***   F I L E   D A T A B A S E   ***
 *************************************/


/**
 * Returns a newly created instance of FileDatabase.
 * @class Instances of this class represent a file based in-process database
 * <br /><strong>Important:</strong> You need the hsqldb.jar in lib/ext
 * of your helma installation for this library to work, which you can get
 * at <a href="http://hsqldb.org/">http://hsqldb.org/</a>.
 * @param {String} name The name of the database
 * @param {helma.File} directory The directory where the database files
 * should be stored in.
 * @returns A newly created FileDatabase instance
 * @constructor
 */
jala.db.FileDatabase = function(name, directory) {

   /**
    * Returns the name of the database
    * @returns The name of the database
    * @type String
    */
   this.getName = function() {
      return name;
   };

   /**
    * Returns the directory where the database files are stored.
    * @returns The directory where the database is stored.
    * @type helma.File
    */
   this.getDirectory = function() {
      return directory;
   };

   return this;
};
// extend RamDatabase
jala.db.FileDatabase.prototype = new jala.db.RamDatabase();

/** @ignore */
jala.db.FileDatabase.prototype.toString = function() {
   return "[Jala FileDatabase " + this.getName() +
          " (" + this.getDirectory().getAbsolutePath() + ")]";
};

/**
 * Returns the path of this database, which is used when adding
 * the database to a server instance.
 * @returns The path of this database within a server instance
 * @type String
 * @private
 */
jala.db.FileDatabase.prototype.getDatabasePath = function() {
   var directory = new helma.File(this.getDirectory(), this.getName());
   return "file:" + directory.getAbsolutePath();
};
