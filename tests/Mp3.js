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
   "testId3v1Write",
   "testId3v1Read",
   "testId3v2Write",
   "testId3v2Read",
   "testMp3Read"
];


/**
 * a global variable containing the mp3 file to write to and read from
 * @type helma.File
 */
var mp3File;


var setup = function() {
   var srcFile = jala.Test.getTestFile("audio.test.mp3");
   mp3File = new helma.File(java.lang.System.getProperty("java.io.tmpdir"), "test.mp3");
   srcFile.hardCopy(mp3File);
   return;
};


/**
 * Write a v1 tag to the file
 */
var testId3v1Write = function() {
   var mp3 = new jala.Mp3(mp3File);
   assertFalse(mp3.hasV1Tag());
   var tag = mp3.createV1Tag();
   assertNotNull(tag);
   tag.setArtist("v1 - jala.Mp3");
   tag.setTitle("v1 - Test");
   tag.setAlbum("v1 - Jala JavaScript Library");
   tag.setGenre("Electronic");
   tag.setComment("v1 - Play it loud!");
   tag.setTrackNumber("1");
   tag.setYear("2006");

   var oldsize = mp3.getSize();
   mp3.save();
   assertNotEqual(mp3.getSize(), oldsize);
   return;
}


/**
 * Read a v1 tag from the file
 */
var testId3v1Read = function() {
   var mp3 = new jala.Mp3(mp3File);
   var tag = mp3.getV1Tag();
   assertEqual(tag.getArtist(), "v1 - jala.Mp3");
   assertEqual(tag.getTitle(), "v1 - Test");
   assertEqual(tag.getAlbum(), "v1 - Jala JavaScript Library");
   assertEqual(tag.getGenre(), "Electronic");
   assertEqual(tag.getComment(), "v1 - Play it loud!");
   assertEqual(tag.getTrackNumber(), "1");
   assertEqual(tag.getYear(), "2006");
   return;
};


/**
 * Write a v2 tag to the file
 */
var testId3v2Write = function() {
   var mp3 = new jala.Mp3(mp3File);
   assertFalse(mp3.hasV2Tag());
   var tag = mp3.createV2Tag();
   assertNotNull(tag);
   tag.setArtist("v2 - jala.Mp3");
   tag.setTitle("v2 - Test");
   tag.setAlbum("v2 - Jala JavaScript Library");
   tag.setGenre("Electronic");
   tag.setComment("v2 - Play it loud!");
   tag.setTrackNumber("2");
   tag.setYear("2007");
   
   tag.setAuthor("SP");
   tag.setCopyright("ORF Online und Teletext GmbH");
   tag.setUrl("http://www.orf.at/");

   var imgFile = jala.Test.getTestFile("audio.test.jpg");
   tag.setImage(3, "image/jpeg", imgFile.toByteArray());

   var oldsize = mp3.getSize();
   mp3.save();
   assertNotEqual(mp3.getSize(), oldsize);
   return;
}


/**
 * Read a v2 tag from the file
 */
var testId3v2Read = function() {
   var mp3 = new jala.Mp3(mp3File);
   var tag = mp3.getV2Tag();
   assertEqual(tag.getArtist(), "v2 - jala.Mp3");
   assertEqual(tag.getTitle(), "v2 - Test");
   assertEqual(tag.getAlbum(), "v2 - Jala JavaScript Library");
   assertEqual(tag.getGenre(), "Electronic");
   assertEqual(tag.getComment(), "v2 - Play it loud!");
   assertEqual(tag.getTrackNumber(), "2");
   assertEqual(tag.getYear(), "2007");

   assertEqual(tag.getAuthor(), "SP");
   assertEqual(tag.getCopyright(), "ORF Online und Teletext GmbH");
   assertEqual(tag.getUrl(), "http://www.orf.at/");

   var mimeObj = tag.getImage();
   var imgFile = jala.Test.getTestFile("audio.test.jpg");
   assertEqual(mimeObj.contentLength, imgFile.getLength());
   return;
};


/**
 * A test of jala.Mp3
 */
var testMp3Read = function() {
   var mp3 = new jala.Mp3(mp3File);
   assertEqual(mp3.artist, "v2 - jala.Mp3");
   assertEqual(mp3.title, "v2 - Test");
   assertEqual(mp3.album, "v2 - Jala JavaScript Library");
   assertEqual(mp3.genre, "Electronic");
   assertEqual(mp3.comment, "v2 - Play it loud!");
   assertEqual(mp3.trackNumber, "2");
   assertEqual(mp3.year, "2007");

   assertEqual(mp3.getChannelMode(), "Stereo");
   assertEqual(mp3.getBitRate(), 192);
   assertEqual(mp3.getDuration(), 7);
   assertEqual(mp3.getSize(), 173832);    // This is after writing tags!
   assertEqual(mp3.getFrequency(), 44.1);
   assertEqual(mp3.parseDuration(), 7);
   return;
};