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
 * @fileoverview Fields and methods of the jala.DnsClient class.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * Jala dependencies
 */
app.addRepository("modules/jala/lib/javadns.jar");

/**
 * Constructs a new DnsClient object.
 * @class This is a wrapper around the Dns Client by wonderly.org
 * providing methods for querying Dns servers. For more information
 * about the Java DNS client visit
 * <a href="https://javadns.dev.java.net/">https://javadns.dev.java.net/</a>
 * @param {String} nameServer IP-Address or FQDN of nameserver to query
 * @constructor
 */
jala.DnsClient = function(nameServer) {
   // slightly awkward test for the presence of the jar file ..
   if (jala.DnsClient.PKG.Question.TYPE_A.constructor != Number) {
      throw("jala.DnsClient requires JavaDNS.jar"
            + " in lib/ext or application directory "
            + "[https://javadns.dev.java.net/]");
   } else if (this.nameServer == null) {
      throw new Error("nameserver to query is missing");
   }
   /**
    * Contains the IP Adress/FQDN of the name server to query.
    * @type String
    */
   this.nameServer = nameServer;
   return this;
};

/** @ignore */
jala.DnsClient.PKG = Packages.org.wonderly.net.dns;

/**
 * The "A" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_A = jala.DnsClient.PKG.Question.TYPE_A;
/**
 * The "NS" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_NS = jala.DnsClient.PKG.Question.TYPE_NS;
/**
 * The "MD" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_MD = jala.DnsClient.PKG.Question.TYPE_MD;
/**
 * The "MF" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_MF = jala.DnsClient.PKG.Question.TYPE_MF;
/**
 * The "CNAME" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_CNAME = jala.DnsClient.PKG.Question.TYPE_CNAME;
/**
 * The "SOA" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_SOA = jala.DnsClient.PKG.Question.TYPE_SOA;
/**
 * The "MB" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_MB = jala.DnsClient.PKG.Question.TYPE_MB;
/**
 * The "MG" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_MG = jala.DnsClient.PKG.Question.TYPE_MG;
/**
 * The "MR" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_MR = jala.DnsClient.PKG.Question.TYPE_MR;
/**
 * The "NULL" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_NULL = jala.DnsClient.PKG.Question.TYPE_NULL;
/**
 * The "WKS" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_WKS = jala.DnsClient.PKG.Question.TYPE_WKS;
/**
 * The "PTR" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_PTR = jala.DnsClient.PKG.Question.TYPE_PTR;
/**
 * The "HINFO" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_HINFO = jala.DnsClient.PKG.Question.TYPE_HINFO;
/**
 * The "MINFO" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_MINFO = jala.DnsClient.PKG.Question.TYPE_MINFO;
/**
 * The "MX" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_MX = jala.DnsClient.PKG.Question.TYPE_MX;
/**
 * The "TXT" record/query type.
 * @type Number
 * @final
 */
jala.DnsClient.TYPE_TXT = jala.DnsClient.PKG.Question.TYPE_TXT;



/**
 * Queries the nameserver for a specific domain
 * and the given type of record.
 * @param {String} dName The domain name to query for
 * @param {Number} queryType The type of records to retrieve
 * @returns The records retrieved from the nameserver
 * @type org.wonderly.net.dns.RR
 */
jala.DnsClient.prototype.query = function(dName, queryType) {
   if (dName == null) {
      throw new Error("no domain-name to query for");
   }
   if (queryType == null) {
      queryType = jala.DnsClient.TYPE_A;
   }
   // construct the question for querying the nameserver
   var question = new jala.DnsClient.PKG.Question(dName,
                  queryType,
                  jala.DnsClient.PKG.Question.CLASS_IN);
   // construct the query
   var query = new jala.DnsClient.PKG.Query(question);
   // run the query
   query.runQuery(this.nameServer);
   return query.getAnswers();
};

/**
 * Convenience method to query for the MX-records
 * of the domain passed as argument.
 * @param {String} dName The domain name to query for
 * @returns The records retrieved from the nameserver
 * @type org.wonderly.net.dns.RR
 */
jala.DnsClient.prototype.queryMailHost = function (dName) {
   return this.query(dName, this.TYPE_MX);
};


/** @ignore */
jala.DnsClient.toString = function() {
   return "[jala.DNS-Client]";
};


/** @ignore */
jala.DnsClient.prototype.toString = function() {
   return "[jala.DNS-Client Object]";
};
