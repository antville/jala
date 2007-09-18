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
 * @class Instances of this class represent a H2 database listener that
 * allows multiple databases to be accessed via tcp.
 * <br /><strong>Important:</strong> You need the h2.jar in directory "lib/ext"
 * of your helma installation for this library to work, which you can get
 * at http://www.h2database.com/.
 * @param {helma.File} baseDir The directory where the database files
 * are located or should be stored
 * @param {Number} port The port to listen on (defaults to 9001)
 * @param {Boolean} createOnDemand If true this server will create non-existing
 * databases on-the-fly, if false it only accepts connections to already
 * existing databases in the given base directory
 * @param {Boolean} makePublic If true this database is reachable from outside,
 * if false it's only reachable from localhost
 * @param {Boolean} useSsl If true SSL will be used to encrypt the connection
 * @returns A newly created Server instance
 * @constructor
 */
jala.db.Server = function(baseDir, port) {

   /**
    * Private variable containing the h2 server instance
    * @type org.h2.tools.Server
    * @private
    */
   var server = null;

   /**
    * An object containing configuration properties used when creating
    * the server instance
    * @private
    */
   var config = {
      "baseDir": baseDir.getAbsolutePath(),
      "tcpPort": port || 9092,
      "tcpSSL": false,
      "ifExists": true,
      "tcpAllowOthers": false,
      "log": false
   };

   /**
    * Returns the wrapped database server instance
    * @returns The wrapped database server
    * @type org.h2.tools.Server
    * @private
    */
   this.getServer = function() {
      return server;
   };

   /**
    * Returns the directory used by this server instance
    * @returns The directory where the databases used by this
    * server are located in
    * @type helma.File
    */
   this.getDirectory = function() {
      return baseDir;
   };

   /**
    * Returns the port this server listens on
    * @returns The port this server listens on
    * @type Number
    */
   this.getPort = function() {
      return config.tcpPort;
   };

   /**
    * Returns the config of this server
    * @returns The config of this server
    * @private
    */
   this.getConfig = function() {
      return config;
   };

   /**
    * Starts the database server.
    * @returns True in case the server started successfully, false otherwise
    * @type Boolean
    */
   this.start = function() {
      if (server != null && server.isRunning()) {
         throw "jala.db.Server: already listening on port " + this.getPort();
      }
      // convert properties into an array
      var config = this.getConfig();
      var args = [];
      for (var propName in config) {
         args.push("-" + propName);
         args.push(config[propName].toString());
      }
      // create the server instance
      server = Packages.org.h2.tools.Server.createTcpServer(args);
      try {
         server.start();
      } catch (e) {
         app.logger.error("jala.db.Server: unable to start server, reason: " + e);
         return false;
      }
      app.logger.info("jala.db.Server: listening on localhost:" + this.getPort());
      return true;
   };


   return this;
};

/** @ignore */
jala.db.Server.prototype.toString = function() {
   return "[Jala Database Server]";
};

/**
 * Stops the database server.
 * @returns True if stopping the server was successful, false otherwise
 * @type Boolean
 */
jala.db.Server.prototype.stop = function() {
   try {
      this.getServer().stop();
      app.logger.info("jala.db.Server: stopped listening on localhost:" +
                      this.getPort());
   } catch (e) {
      app.logger.error("jala.db.Server: Unable to stop, reason: " + e);
      return false;
   }
   return true;
};

/**
 * Returns true if the database server is running.
 * @returns True if the database server is running
 * @type Boolean
 */
jala.db.Server.prototype.isRunning = function() {
   return this.getServer().isRunning();
};

/**
 * Toggles the use of Ssl encryption within this server. This should be set
 * before starting the server.
 * @param {Boolean} bool If true SSL encryption will be used, false
 * otherwise. If no argument is given, this method returns the
 * current setting.
 * @returns The current setting if no argument is given, or void
 * @type Boolean
 */
jala.db.Server.prototype.useSsl = function(bool) {
   var config = this.getConfig();
   if (bool != null) {
      config.tcpSSL = (bool === true);
   } else {
      return config.tcpSSL;
   }
   return;
};

/**
 * If called with boolean true as argument, this server creates databases
 * on-the-fly, otherwise it only accepts connections to already existing
 * databases. This should be set before starting the server.
 * @param {Boolean} bool If true this server creates non-existing databases
 * on demand, if false it only allows connections to existing databases.
 * If no argument is given, this method returns the current setting.
 * @returns The current setting if no argument is given, or void
 * @type Boolean
 */
jala.db.Server.prototype.createOnDemand = function(bool) {
   var config = this.getConfig();
   if (bool != null) {
      config.ifExists = (bool === false);
   } else {
      return !config.ifExists;
   }
   return;
};

/**
 * If called with boolean true as argument, this server accepts connections
 * from outside localhost. This should be set before starting the server.
 * @param {Boolean} bool If true this server accepts connections from outside
 * localhost. If no argument is given, this method returns the current setting.
 * @returns The current setting if no argument is given, or void
 * @type Boolean
 */
jala.db.Server.prototype.isPublic = function(bool) {
   var config = this.getConfig();
   if (bool != null) {
      config.tcpAllowOthers = (bool === true);
   } else {
      return config.tcpAllowOthers;
   }
   return;
};

/**
 * Returns the JDBC Url to use for connections to a given database.
 * @param {String} name An optional name of a database running
 * @param {Object} props Optional connection properties to add
 * @returns The JDBC Url to use for connecting to a database
 * within this sever
 * @type String
 */
jala.db.Server.prototype.getUrl = function(name, props) {
   res.push();
   res.write("jdbc:h2:");
   res.write(this.useSsl() ? "ssl" : "tcp");
   res.write("://localhost:");
   res.write(this.getPort());
   res.write("/");
   res.write(name);
   res.write(jala.db.getPropertyString(props))
   return res.pop();
};

/**
 * Returns a properties object containing the connection properties
 * of the database with the given name.
 * @param {String} name The name of the database
 * @param {String} username Optional username to use for this connection
 * @param {String} password Optional password to use for this connection
 * @param {Object} props An optional parameter object containing
 * connection properties to add to the connection Url.
 * @returns A properties object containing the connection properties
 * @type helma.util.ResourceProperties
 */
jala.db.Server.prototype.getProperties = function(name, username, password, props) {
   var rp = new Packages.helma.util.ResourceProperties();
   rp.put(name + ".url", this.getUrl(name, props));
   rp.put(name + ".driver", "org.h2.Driver");
   rp.put(name + ".user", username || "sa");
   rp.put(name + ".password", password || "");
   return rp;
};

/**
 * Returns a connection to a database within this server.
 * @param {String} name The name of the database running
 * within this server
 * @param {String} username Optional username to use for this connection
 * @param {String} password Optional password to use for this connection
 * @param {Object} props An optional parameter object
 * containing connection properties to add to the connection Url.
 * @returns A connection to the specified database
 * @type helma.Database
 */
jala.db.Server.prototype.getConnection = function(name, username, password, props) {
   var rp = this.getProperties(name, username, password, props);
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
 * @private
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
 * <br /><strong>Important:</strong> You need the h2.jar in directory "lib/ext"
 * of your helma installation for this library to work, which you can get
 * at http://www.h2database.com/.
 * @param {String} name The name of the database. If not given a private
 * un-named database is created, that can only be accessed through this instance
 * of jala.db.RamDatabase
 * @param {String} username Optional username (defaults to "sa"). This username
 * is used when creating the database, so the same should be used when
 * creating subsequent instances of jala.db.RamDatabase pointing to a named
 * database.
 * @param {String} password Optional password (defaults to "").
 * @returns A newly created instance of RamDatabase
 * @constructor
 */
jala.db.RamDatabase = function(name, username, password) {

   /**
    * Returns the name of the database
    * @returns The name of the database
    * @type String
    */
   this.getName = function() {
      return name;
   };

   /**
    * Returns the username of this database
    * @returns The username of this database
    * @type String
    */
   this.getUsername = function() {
      return username;
   };
   
   /**
    * Returns the password of this database
    * @returns The password of this database
    * @type String
    */
   this.getPassword = function() {
      return password;
   };

   /**
    * Main constructor body
    */
   if (!username) {
      username = "sa";
   }
   if (!password) {
      password = "";
   }

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
   var url = "jdbc:h2:" + this.getDatabasePath();
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
   rp.put(name + ".driver", "org.h2.Driver");
   rp.put(name + ".user", this.getUsername());
   rp.put(name + ".password", this.getPassword());
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
 * @private
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
 * @private
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
 * @private
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
 * @param {helma.File} file The script file to run
 * @param {Object} props Optional object containing connection properties
 * @param {String} charset Optional character set to use (defaults to "UTF-8")
 * @param {Boolean} continueOnError Optional flag indicating whether to continue
 * on error or not (defaults to false)
 * @returns True in case the script was executed successfully, false otherwise
 * @type Boolean
 */
jala.db.RamDatabase.prototype.runScript = function(file, props, charset, continueOnError) {
   try {
      Packages.org.h2.tools.RunScript.execute(
         this.getUrl(props),
         "sa",
         "",
         file.getAbsolutePath(),
         charset || "UTF-8",
         continueOnError === true
      );
      app.logger.info("jala.db: successfully executed SQL script '" +
                      file.getAbsolutePath() + "'");
   } catch (e) {
      app.logger.error("jala.db: executing SQL script failed, reason: " + e);
      return false;
   }
   return true;
};

/**
 * Dumps the database schema and data into a file
 * @param {helma.File} file The file where the database dump will be
 * @param {Object} props Optional object containing connection properties
 * @returns True in case the database was successfully dumped, false otherwise
 * @type Boolean
 */
jala.db.RamDatabase.prototype.dump = function(file, props) {
   try {
      Packages.org.h2.tools.Script.execute(this.getUrl(props),
            "sa", "", file.getAbsolutePath());
   } catch (e) {
      app.logger.error("jala.db: Unable to dump database to '" + file.getAbsolutePath() +
            ", reason: " + e.toString());
      return false;
   }
   return true;
};


/*************************************
 ***   F I L E   D A T A B A S E   ***
 *************************************/


/**
 * Returns a newly created instance of FileDatabase.
 * @class Instances of this class represent a file based in-process database
 * <br /><strong>Important:</strong> You need the h2.jar in directory "lib/ext"
 * of your helma installation for this library to work, which you can get
 * at http://www.h2database.com/.
 * @param {String} name The name of the database. This name is used as
 * prefix for all database files
 * @param {helma.File} directory The directory where the database files
 * should be stored in.
 * @param {String} username Optional username (defaults to "sa"). This username
 * is used when creating the database, so the same should be used when
 * creating subsequent instances of jala.db.FileDatabase pointing to the
 * same database
 * @param {String} password Optional password (defaults to "").
 * @returns A newly created FileDatabase instance
 * @constructor
 */
jala.db.FileDatabase = function(name, directory, username, password) {

   /**
    * Returns the name of the database. This name is used as prefix
    * for all files of this database in the specified directory
    * @returns The name of the database
    * @type String
    */
   this.getName = function() {
      return name;
   };

   /**
    * Returns the directory where the database files are stored.
    * @returns The directory where this database is stored.
    * @type helma.File
    */
   this.getDirectory = function() {
      return directory;
   };

   /**
    * Returns the username of this database
    * @returns The username of this database
    * @type String
    */
   this.getUsername = function() {
      return username;
   };
   
   /**
    * Returns the password of this database
    * @returns The password of this database
    * @type String
    */
   this.getPassword = function() {
      return password;
   };

   if (!name || typeof(name) != "string" ||
             !directory || !(directory instanceof helma.File)) {
      throw "jala.db.FileDatabase: Missing or invalid arguments"
   } else if (!directory.exists()) {
      throw "jala.db.FileDatabase: directory '" + directory + "' does not exist";
   }

   return this;
};
// extend RamDatabase
jala.db.FileDatabase.prototype = new jala.db.RamDatabase();

/** @ignore */
jala.db.FileDatabase.prototype.toString = function() {
   return "[Jala FileDatabase '" + this.getName() + "' in "
          + this.getDirectory().getAbsolutePath() + "]";
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

/**
 * Deletes all files of this database on disk. Note that this also
 * closes the database before removing it.
 * @returns True in case the database was removed successfully, false otherwise
 * @type Boolean
 */
jala.db.FileDatabase.prototype.remove = function() {
   var directory = this.getDirectory();
   try {
      // shut down the database
      this.shutdown();
      Packages.org.h2.tools.DeleteDbFiles.execute(
         directory.getAbsolutePath(),
         this.getName(),
         false
      );
   } catch(e) {
      app.logger.error("jala.db: Unable to delete database in " +
            directory.getAbsolutePath() + ", reason: " + e);
      return false;
   }
   return true;
};

/**
 * Creates a backup of this database, using the file passed as argument. The
 * result will be a zipped file containing the database files
 * @param {helma.File} file The file to write the backup to
 * @returns True if the database backup was created successfully, false otherwise
 * @type Boolean
 */
jala.db.FileDatabase.prototype.backup = function(file) {
   try {
      Packages.org.h2.tools.Backup.execute(
         file.getAbsolutePath(),
         this.getDirectory().getAbsolutePath(),
         this.getName(),
         false
      );
   } catch (e) {
      app.logger.error("jala.db: Unable to backup database to '" +
                       file.getAbsolutePath() + ", reason: " + e);
      return false;
   }
   return true;
};

/**
 * Restores this database using a backup on disk.
 * @param {helma.File} backupFile The backup file to use for restore
 * @returns True if the database was successfully restored, false otherwise
 * @type Boolean
 */
jala.db.FileDatabase.prototype.restore = function(backupFile) {
   try {
      Packages.org.h2.tools.Restore.execute(
         backupFile.getAbsolutePath(),
         this.getDirectory().getAbsolutePath(),
         this.getName(),
         false
      );
   } catch (e) {
      app.logger.error("jala.db: Unable to restore database using '" +
                       backupFile.getAbsolutePath() + ", reason: " + e);
      return false;
   }
   return true;
};
