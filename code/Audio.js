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
 * @fileoverview Fields and methods of the jala.audio package.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * Jala dependencies
 */
app.addRepository("modules/jala/lib/java_mp3.jar");


/**
 * @class This is the root for all audio classes
 */
jala.audio = {};



/**
 * Constructs a new jala.audio.Mp3 wrapper and
 * parses the header data of the MP3 file.
 * The standard fields for a tag are accessible
 * as properties of the new object.
 *
 * @class This is a class representing an MP3 file
 * providing methods to access its metadata.
 *
 * @param {String | File} The mp3 file to be parsed, either as
 *                      path string or as any kind of file object
 *
 * @constructor
 */
jala.audio.Mp3 = function(file) {

   // check and normalize file argument
   if (!file) {
      throw "jala.audio.Mp3: missing argument";
   } else if (typeof(file) == "string") {
      file = new helma.File(file);
   } else if (!(file instanceof helma.File)) {
      try {
         file = new helma.File(file.getAbsolutePath());
      } catch (e) {
         throw "jala.audio.Mp3: requires a path string "
               + "or a file object as argument";
      }
   }

   try {
      var clazz = java.lang.Class.forName("org.farng.mp3.MP3File",
                                          false, app.getClassLoader())
   } catch (e) {
      throw "jala.audio.Mp3 requires java_mp3.jar"
            + " in lib/ext or modules/jala/lib directory "
            + "[http://javamusictag.sourceforge.net/]";
   }

   var mp3File = new Packages.org.farng.mp3.MP3File(file.getAbsolutePath());

   /**
    * Returns a helma.File reference to the wrapped file.
    * @type helma.File
    */
   this.getFile = function() {
      return file;
   };

   /**
    * @returns the underlying java object
    * @type org.farng.mp3.MP3File
    */
   this.getJavaObject = function() {
      return mp3File;
   };


   /**   @type String   */
   this.album;

   /**   @type String   */
   this.artist;

   /**   @type String   */
   this.comment;

   /**   @type String   */
   this.genre;

   /**   @type String   */
   this.title;

   /**   @type String   */
   this.trackNumber;

   /**   @type String   */
   this.year;

   return this;
};

// define getter for standard fields:
try {
   jala.audio.Mp3.prototype.__defineGetter__("album", function() {   return this.getField("album");   });
   jala.audio.Mp3.prototype.__defineGetter__("artist", function() {   return this.getField("artist");   });
   jala.audio.Mp3.prototype.__defineGetter__("comment", function() {   return this.getField("comment");   });
   jala.audio.Mp3.prototype.__defineGetter__("genre", function() {   return this.getField("genre");   });
   jala.audio.Mp3.prototype.__defineGetter__("title", function() {   return this.getField("title");   });
   jala.audio.Mp3.prototype.__defineGetter__("trackNumber", function() {   return this.getField("trackNumber");   });
   jala.audio.Mp3.prototype.__defineGetter__("year", function() {   return this.getField("year");   });
} catch (e) {
   // older helma versions can't handle __defineGetter__
}

/**
 * Returns the information for a field from the tags: At first the ID3v2
 * tag is checked. If it isn't present or doesn't contain the field,
 * the ID3v1 tag is checked.
 * @type {String}
 * @private
 */
jala.audio.Mp3.prototype.getField = function(fieldName) {
   var id3v1 = this.getV1Tag();
   var id3v2 = this.getV2Tag();
   var funcName = "get" + fieldName.head(1, "").toUpperCase() + fieldName.tail(1, "");
   if (id3v2) {
      var val = id3v2[funcName]();
      if (val) {
         return val;
      }
   }
   if (id3v1) {
      return id3v1[funcName]();
   }
   return null;
};


/**
 * If the file doesn't contain the given tag, this method
 * creates a new tag object, attaches it to the file
 * and returns it. Type is specified using the class
 * name in jala.audio.tag.*. If a second argument is
 * provided, its values are copied into the new tag.
 *
 * @param {Object} tagClass
 * @param {Object} tagObject optional tag whose standard
 *        properties are copied to the new tag.
 * @type Object
 */
jala.audio.Mp3.prototype.createTag = function(tagClass, tagObject) {
};


/**
 * The audio length of the file in seconds at best estimate from the file info (method returns immediately).
 */
jala.audio.Mp3.prototype.getDuration = function() {
};


/**
 * Returns the file size in bytes.
 * @type Number
 */
jala.audio.Mp3.prototype.getSize = function() {
   return this.getFile().getLength();
};


/**
 * Returns a tag object, type is specified using the class name
 * in jala.audio.tag.*.
 * @type Object
 */
jala.audio.Mp3.prototype.getTag = function(tagClass) {
   try {
      return new tagClass(this);
   } catch (e) {
      return null;
   }
};


/**
 * Tells if the file contains a certain tag, type is specified
 * using the class name in jala.audio.tag.*
 */
jala.audio.Mp3.prototype.hasTag = function(tagClass) {
   try {
      var check = new tagClass(this);
      return true;
   } catch (e) {
      return false;
   }
};


/**
 * Removes a tag from the file, type is specified using the
 * class name in jala.audio.tag.*
 */
jala.audio.Mp3.prototype.removeTag = function(tagClass) {
};


/**
 * Writes changed metadata back to the source file or to a new file. 
 * @param {helma.File} file (optional) save the modified file
 *                       to a different file
 */
jala.audio.Mp3.prototype.save = function(file) {
   // TODO: handling of the extra file argument
   this.getJavaObject().save();
};


/**
 * 
 */
jala.audio.Mp3.prototype.getBitRate = function() {
};


/**
 * 
 */
jala.audio.Mp3.prototype.getChannelMode = function() {
};


/**
 * 
 */
jala.audio.Mp3.prototype.getFrameRate = function() {
};


/**
 * If the file doesn't contain an ID3v1 tag, this method
 * creates a new ID3v1 tag object, attaches it to the file
 * and returns it. If a second argument is provided, its
 * values are copied into the new tag.
 *
 * @param {Object} tagObject optional tag whose standard
 *        properties are copied to the new tag.
 * @type jala.audio.tag.Id3v1
 */
jala.audio.Mp3.prototype.createV1Tag = function(tagObject) {
   return this.createTag(jala.audio.tag.Id3v1, tagObject);
};


/**
 * If the file doesn't contain an ID3v2 tag, this method
 * creates a new ID3v2 tag object, attaches it to the file
 * and returns it. If a second argument is provided, its
 * values are copied into the new tag.
 *
 * @param {Object} tagObject optional tag whose standard
 *        properties are copied to the new tag.
 * @type jala.audio.tag.Id3v2
 */
jala.audio.Mp3.prototype.createV2Tag = function(tagObject) {
   return this.createTag(jala.audio.tag.Id3v2, tagObject);
};


/**
 * @type jala.audio.tag.Id3v1
 */
jala.audio.Mp3.prototype.getV1Tag = function() {
   return this.getTag(jala.audio.tag.Id3v1);
};


/**
 * @type jala.audio.tag.Id3v2
 */
jala.audio.Mp3.prototype.getV2Tag = function() {
   return this.getTag(jala.audio.tag.Id3v2);
};


/**
 * Returns true if the file contains a ID3v1 tag.
 * @type Boolean
 */
jala.audio.Mp3.prototype.hasV1Tag = function() {
   return this.hasTag(jala.audio.tag.Id3v1);
};


/**
 * Returns true if the file contains a ID3v2 tag.
 * @type Boolean
 */
jala.audio.Mp3.prototype.hasV2Tag = function() {
   return this.hasTag(jala.audio.tag.Id3v2);
};


/**
 * Removes the ID3v1 tag from the file.
 */
jala.audio.Mp3.prototype.removeV1Tag = function() {
   this.removeTag(jala.audio.tag.Id3v1);
};


/**
 * Removes the ID3v2 tag from the file.
 */
jala.audio.Mp3.prototype.removeV2Tag = function() {
   return this.removeTag(jala.audio.tag.Id3v2);
};


/**
 * 
 */
jala.audio.Mp3.prototype.isVariableBitRate = function() {
};


/**
 * Parses the audio file to extract the precise duration of the audio
 * (this may take some seconds).
 */
jala.audio.Mp3.prototype.parseDuration = function() {
};


/** @ignore */
jala.audio.Mp3.toString = function() {
   return "[jala.audio.Mp3 " + this.getFile() + "]";
};

/** @ignore */
jala.audio.Mp3.prototype.toString = jala.audio.Mp3.toString;



jala.audio.Mp3.GENRES = ["Blues", "Classic Rock", "Country", "Dance", "Disco",
   "Funk", "Grunge", "Hip-Hop", "Jazz", "Metal", "New Age", "Oldies", "Other",
   "Pop", "R&B", "Rap", "Reggae", "Rock", "Techno", "Industrial", "Alternative",
   "Ska", "Death Metal", "Pranks", "Soundtrack", "Euro-Techno", "Ambient",
   "Trip-Hop", "Vocal", "Jazz+Funk", "Fusion", "Trance", "Classical",
   "Instrumental", "Acid", "House", "Game", "Sound Clip", "Gospel", "Noise",
   "AlternRock", "Bass", "Soul", "Punk", "Space", "Meditative", "Instrumental Pop",
   "Instrumental Rock", "Ethnic", "Gothic", "Darkwave", "Techno-Industrial",
   "Electronic", "Pop-Folk", "Eurodance", "Dream", "Southern Rock", "Comedy",
   "Cult", "Gangsta", "Top 40", "Christian Rap", "Pop/Funk", "Jungle",
   "Native American", "Cabaret", "New Wave", "Psychadelic", "Rave",
   "Showtunes", "Trailer", "Lo-Fi", "Tribal", "Acid Punk", "Acid Jazz", "Polka",
   "Retro", "Musical", "Rock & Roll", "Hard Rock", "Folk", "Folk-Rock",
   "National Folk", "Swing", "Fast Fusion", "Bebob", "Latin", "Revival", "Celtic",
   "Bluegrass", "Avantgarde", "Gothic Rock", "Progressive Rock",
   "Psychedelic Rock", "Symphonic Rock", "Slow Rock", "Big Band", "Chorus",
   "Easy Listening", "Acoustic", "Humour", "Speech", "Chanson", "Opera",
   "Chamber Music", "Sonata", "Symphony", "Booty Bass", "Primus", "Porn Groove",
   "Satire", "Slow Jam", "Club", "Tango", "Samba", "Folklore", "Ballad",
   "Power Ballad", "Rhythmic Soul", "Freestyle", "Duet", "Punk Rock", "Drum Solo",
   "Acapella", "Euro-House", "Dance Hall"];



/**
 * @class This is the root for all tag classes
 */
jala.audio.tag = {};


/**
 * Constructs a new Id3v1 tag from an Mp3 file
 * @param {jala.audio.Mp3} mp3File
 * @class This class represents an Id3v1 tag.
 * @constructor
 */
jala.audio.tag.Id3v1 = function(audioObj) {

   var tag = audioObj.getJavaObject().getID3v1Tag();
   if (!tag) {
      throw "no Id3v1 tag in file";
   }

   /**
    * Returns the wrapper for the underlying audio file.
    * @type jala.audio.Mp3
    */
   this.getAudio = function() {
      return audioObj;
   }

   /**
    * Returns the java representation of the tag,
    * class depends on the actual library used.
    * @type org.farng.mp3.id3.AbstractID3v1
    */
   this.getJavaObject = function() {
      return tag;
   };   

};


/**
 * copies tag information from another tag.
 * @param {Object} tag
 */
jala.audio.tag.Id3v1.prototype.copyFrom = function(tag) {
};


/**
 * Returns the album information of the tag.
 * @returns string containing album name
 * @type String
 */
jala.audio.tag.Id3v1.prototype.getAlbum = function() {
   return this.getJavaObject().getAlbumTitle();
};


/**
 * Returns the artist information of the tag.
 * @returns string containing artist name
 * @type String
 */
jala.audio.tag.Id3v1.prototype.getArtist = function() {
   return this.getJavaObject().getLeadArtist();
};


/**
 * Returns the comment information of the tag.
 * @returns string containing comment
 * @type String
 */
jala.audio.tag.Id3v1.prototype.getComment = function() {
   return this.getJavaObject().getSongComment();
};


/**
 * Returns the title information of the tag.
 * @returns string containing title
 * @type String
 */
jala.audio.tag.Id3v1.prototype.getTitle = function() {
   return this.getJavaObject().getSongTitle();
};


/**
 * Returns the track number information of the tag.
 * @returns string representing track number
 * @type String
 */
jala.audio.tag.Id3v1.prototype.getTrackNumber = function() {
   return this.getJavaObject().getTrackNumberOnAlbum();
};


/**
 * Returns the genre information of the tag.
 * @returns string containing genre name
 * @type String
 */
jala.audio.tag.Id3v1.prototype.getGenre = function() {
   var genre = this.getJavaObject().getGenre();
   return Packages.org.farng.mp3.TagConstant.genreIdToString.get(new java.lang.Long(genre));
};


/**
 * Returns the year information of the tag.
 * @returns string representing year
 * @type String
 */
jala.audio.tag.Id3v1.prototype.getYear = function() {
   return this.getJavaObject().getYearReleased();
};


/**
 * This method could be used to retrieve an arbitrary field
 * of the underlying tag. For Id3v1 tags all information
 * is available through getter and setter methods, so this
 * implementation always returns null.
 * @param {String} id
 * @returns null
 */
jala.audio.tag.Id3v1.prototype.getTextContent = function(id) {
   return null;
}


/**
 * Sets the album information.
 * @param {String} album
 */
jala.audio.tag.Id3v1.prototype.setAlbum = function(album) {
   this.getJavaObject().setAlbumTitle(album);
};


/**
 * Sets the artist information.
 * @param {String} artist
 */
jala.audio.tag.Id3v1.prototype.setArtist = function(artist) {
   this.getJavaObject().setLeadArtist(artist);
};


/**
 * Sets the comment
 * @param {String} comment
 */
jala.audio.tag.Id3v1.prototype.setComment = function(comment) {
   this.getJavaObject().setSongComment(comment);
};


/**
 * Sets the title information
 * @param {String} title
 */
jala.audio.tag.Id3v1.prototype.setTitle = function(title) {
   this.getJavaObject().setSongTitle(title);
};


/**
 * Sets the track number information.
 * @param {Number} trackNumber
 */
jala.audio.tag.Id3v1.prototype.setTrackNumber = function(trackNumber) {
   this.getJavaObject().setTrackNumberOnAlbum(trackNumber);
};


/**
 * Sets the genre information. A list of genre names that are valid
 * for ID3v1 tags is located in jala.audio.Mp3.GENRES.
 * @param {String} genre
 */
jala.audio.tag.Id3v1.prototype.setGenre = function(genre) {
   var genreByte = Packages.org.farng.mp3.TagConstant.genreStringToId.get(genre);
   this.getJavaObject().setSongGenre(genreByte);
};


/**
 * Sets the year information.
 * @param {Number} year
 */
jala.audio.tag.Id3v1.prototype.setYear = function(year) {
   this.getJavaObject().setYearReleased(year);
};


/**
 * This method could be used to set an arbitrary field
 * of the underlying tag. For Id3v1 tags all information
 * is available through getter and setter methods, so this
 * implementation does nothing.
 * @param {String} id
 * @param {String} value
 */
jala.audio.tag.Id3v1.prototype.setTextContent = function(id, val)  {
};


/** @ignore */
jala.audio.tag.Id3v1.toString = function() {
   return "[jala.audio.tag.Id3v1]";
};

/** @ignore */
jala.audio.tag.Id3v1.prototype.toString = jala.audio.tag.Id3v1.toString;






/**
 * Constructs a new Id3v2 tag from an Mp3 file
 * @param {jala.audio.Mp3} mp3File
 * @class This class represents an Id3v2 tag.
 * @constructor
 */
jala.audio.tag.Id3v2 = function(audioObj) {

   var tag = audioObj.getJavaObject().getID3v2Tag();
   if (!tag) {
      throw "no Id3v2 tag in file";
   }


   /**
    * Returns the wrapper for the underlying audio file.
    * @type jala.audio.Mp3
    */
   this.getAudio = function() {
      return audioObj;
   }


   /**
    * returns the java representation of the tag,
    * class depends on the actual library used.
    * @type org.farng.mp3.id3.AbstractID3v2
    */
   this.getJavaObject = function() {
      return tag;
   };
   
};


/**
 * copies tag information from another tag.
 * @param {Object} tag
 */
jala.audio.tag.Id3v2.prototype.copyFrom = function(tag) {
};


/**
 * Returns the album information of the tag.
 * @returns string containing album name
 * @type String
 */
jala.audio.tag.Id3v2.prototype.getAlbum = function() {
   return this.getJavaObject().getAlbumTitle();
};


/**
 * Returns the artist information of the tag.
 * @returns string containing artist name
 * @type String
 */
jala.audio.tag.Id3v2.prototype.getArtist = function() {
   return this.getJavaObject().getLeadArtist();
};


/**
 * Returns the comment information of the tag.
 * @returns string containing comment
 * @type String
 */
jala.audio.tag.Id3v2.prototype.getComment = function() {
   return this.getJavaObject().getSongComment();
};


/**
 * Returns the title information of the tag.
 * @returns string containing title
 * @type String
 */
jala.audio.tag.Id3v2.prototype.getTitle = function() {
   return this.getJavaObject().getSongTitle();
};


/**
 * Returns the track number information of the tag.
 * @returns string representing track number
 * @type String
 */
jala.audio.tag.Id3v2.prototype.getTrackNumber = function() {
   return this.getJavaObject().getTrackNumberOnAlbum();
};


/**
 * Returns the genre information of the tag.
 * @returns string containing genre name
 * @type String
 */
jala.audio.tag.Id3v2.prototype.getGenre = function() {
   return this.getJavaObject().getSongGenre();
};


/**
 * Returns the year information of the tag.
 * @returns string representing year
 * @type String
 */
jala.audio.tag.Id3v2.prototype.getYear = function() {
   return this.getJavaObject().getYearReleased();
};


/**
 * This method can be used to retrieve an arbitrary field
 * of the underlying tag. For the list of valid identifiers
 * and their meaning see http://www.id3.org/
 * The identifiers vary across the sub versions of id3v2 tags,
 * use getSubtype and convertToSubtype to make sure you use the
 * correct version.
 * @param {String} id Frame identifier according to Id3v2 specification
 * @returns String contained in the frame
 * @type String
 * @see #getSubtype
 * @see #convertToSubtype
 */
jala.audio.tag.Id3v2.prototype.getTextContent = function(id) {
   return null;
}


/**
 * Sets the album information.
 * @param {String} album
 */
jala.audio.tag.Id3v2.prototype.setAlbum = function(album) {
   this.getJavaObject().setAlbumTitle(album);

};


/**
 * Sets the artist information.
 * @param {String} artist
 */
jala.audio.tag.Id3v2.prototype.setArtist = function(artist) {
   this.getJavaObject().setLeadArtist(artist);
};


/**
 * Sets the comment
 * @param {String} comment
 */
jala.audio.tag.Id3v2.prototype.setComment = function(comment) {
   this.getJavaObject().setSongComment(comment);
};


/**
 * Sets the title information
 * @param {String} title
 */
jala.audio.tag.Id3v2.prototype.setTitle = function(title) {
   this.getJavaObject().setSongTitle(title);
};


/**
 * Sets the track number information.
 * @param {Number} trackNumber
 */
jala.audio.tag.Id3v2.prototype.setTrackNumber = function(trackNumber) {
   this.getJavaObject().setTrackNumberOnAlbum(trackNumber);
};


/**
 * Sets the genre information. A list of genre names that are compatible
 * with ID3v1 tags is located in jala.audio.Mp3.GENRES.
 * @param {String} genre
 */
jala.audio.tag.Id3v2.prototype.setGenre = function(genre) {
   this.getJavaObject().setSongGenre(genre);
};


/**
 * Sets the year information.
 * @param {Number} year
 */
jala.audio.tag.Id3v2.prototype.setYear = function(year) {
   this.getJavaObject().setYearReleased(year);
};


/**
 * This method can be used to set an arbitrary field
 * of the underlying tag. For the list of valid identifiers
 * and their meaning see http://www.id3.org/
 * The identifiers vary across the sub versions of id3v2 tags,
 * use getSubtype and convertToSubtype to make sure you use the
 * correct version.
 * @param {String} id Frame identifier according to Id3v2 specification
 * @param {String} value
 * @type String
 * @see #getSubtype
 * @see #convertToSubtype
 */
jala.audio.tag.Id3v2.prototype.setTextContent = function(id, val)  {
};


/**
 * Converts the tag to the id3v2 tag of the given sub-version number (2, 3 or 4).
 */
jala.audio.tag.Id3v2.prototype.convertToSubtype = function(type) {
   // TODO: dig to find out how this conversion is done with JavaMusicTag
};


/**
 * 
 */
jala.audio.tag.Id3v2.prototype.getComposer = function() {
};


/**
 * 
 */
jala.audio.tag.Id3v2.prototype.getCopyright = function() {
};


/**
 * returns image as helma.util.MimePart.
 */
jala.audio.tag.Id3v2.prototype.getImage = function(pictureType) {
};



/**
 * returns the version number of id3v2 tags used (values 2 to 4 for id3v2.2 to id3v2.4)
 */
jala.audio.tag.Id3v2.prototype.getSubtype = function() {
   // TODO: getRevision() didn't return anything for test files!
   return this.getJavaObject().getRevision();
};


/**
 * 
 */
jala.audio.tag.Id3v2.prototype.getUrl = function() {
};


/**
 * 
 */
jala.audio.tag.Id3v2.prototype.setComposer = function(composer) {
};


/**
 * 
 */
jala.audio.tag.Id3v2.prototype.setCopyright = function(copyright) {
};


/**
 * adds an image to the file.
 */
jala.audio.tag.Id3v2.prototype.setImage = function(mimeType, pictureType, binArray, desc) {
};



/**
 * sets the text encoding used when setting values.
 */
jala.audio.tag.Id3v2.prototype.setTextEncoding = function(encType) {
};


/**
 * 
 */
jala.audio.tag.Id3v2.prototype.setUrl = function(url) {
};


/** @ignore */
jala.audio.tag.Id3v2.toString = function() {
   return "[jala.audio.tag.Id3v2]";
};

/** @ignore */
jala.audio.tag.Id3v2.prototype.toString = jala.audio.tag.Id3v2.toString;

