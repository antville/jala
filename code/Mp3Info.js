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
 * @fileoverview Fields and methods of the jala.Mp3Info class.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * Jala dependencies
 */
app.addRepository("modules/jala/lib/id3-1.6.0d9.jar");


/**
 * Construct an Mp3Info object.
 * @class Wrapper class for the
 * {@link http://www.ueberdosis.de/java/id3.html ID3Reader Java package}.
 * This class provides easy access to the ID3 tags of an arbitrary
 * MP3-encoded audio file.
 * @param {String} path The file path to the MP3 audio file.
 * @returns A new Mp3Info object.
 * @constructor
 */
jala.Mp3Info = function(path) {
   if (!path)
      throw "Insufficient arguments: missing path to mp3 file";

   var MP3PKG = Packages.de.ueberdosis.mp3info.ID3Reader;
   var MP3PKGNAME = "id3.jar";
   var MP3PKGURL = "http://www.ueberdosis.de/java/id3.html";

   var file = new java.io.File(path);
   var raf = new java.io.RandomAccessFile(file, "r");
   var tag, eTag;
   try {
      tag = Packages.de.ueberdosis.mp3info.ID3Reader.readTag(raf);
      eTag = Packages.de.ueberdosis.mp3info.ID3Reader.readExtendedTag(raf);
      raf.close();
      raf = null;
   } catch (e) {
      if (e instanceof TypeError == false)
         throw(e);
      throw("jala.Mp3Info requires " + MP3PKGNAME + 
            " in lib/ext or application directory " +
            "[" + MP3PKGURL + "]");
   }

   // id3 tag values

   /**
    * The album name.
    * @type String
    */
   this.album = tag.getAlbum();

   /**
    * The artist's name.
    * @type String
    */
   this.artist = tag.getArtist();

   /**
    * Additional comments about this MP3 file.
    * @type String
    */
   this.comment = tag.getComment();

   /**
    * The genre type.
    * @type String
    */
   this.genre = tag.getGenreS();

   /**
    * The track title.
    * @type String
    */
   this.title = tag.getTitle();

   /**
    * The track number.
    * @type String
    */
   this.track = tag.getTrackS();

   /**
    * The year of the release.
    * @type String
    */
   this.year = tag.getYear();

   // extended id3 tag values

   /**
    * The file size in Bytes.
    * @type String
    */
   this.size = eTag.getSize();

   /**
    * The track duration in seconds.
    * @type String
    */
   this.duration = eTag.getRuntime();

   /**
    * The bit rate.
    * @type String
    */
   this.bitrate = eTag.getBitrateS() || 0;

   /**
    * The sample frequency in Hz.
    * @type String
    */
   this.frequency = eTag.getFrequencyI() || 0;

   /**
    * The channel mode.
    * For example "Joint Stereo (Stereo)".
    * @type String
    */
   this.channelMode = eTag.getChannelModeS();

   /**
    * The layer number.
    * @type String
    */
   this.layer = eTag.getLayerI();

   /**
    * Get the MP3 file.
    * @returns The MP3 file.
    * @type File
    */
   this.getFile = function() {
      return file;
   };

   /**
    * A string representation of the MP3 file.
    * @returns Artist and track name.
    * @type String
    */
   this.toString = function() {
      return "[jala.Mp3Info of " + file.getCanonicalPath() + "]";
   };

   this.dontEnum("getFile");
   this.dontEnum("toString");
   return this;
};
