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
   "testId3",
   "testId3v2"
];

/**
 * A simple test of jala.Mp3Info.
 */
var testId3 = function() {
   var fpath = jala.Test.getTestFile("test.mp3") + "/";
   var mp3 = new jala.Mp3Info(fpath);
   assertEqual(mp3.artist, "jala.Mp3Info");
   assertEqual(mp3.title, "Test");
   assertEqual(mp3.album, "Jala JavaScript Library");
   assertEqual(mp3.genre, "Electronic");
   assertEqual(mp3.channelMode, "Stereo");
   assertEqual(mp3.comment, "Play it loud!");
   assertEqual(mp3.track, "14");    // Shouldn't this be a number?
   assertEqual(mp3.bitrate, "192"); // Or this?
   assertEqual(mp3.year, "2007");   // ...
   assertEqual(mp3.layer, 3);
   assertEqual(mp3.duration, 6);
   assertEqual(mp3.size, 165640);
   assertEqual(mp3.frequency, 44100);
   assertTrue(mp3.getFile().equals(new java.io.File(fpath)));
   return;
};

var testId3v2 = function() {
   // MP3 files containing ID3v2 tags only are currently not supported
   var mp3 = jala.Test.getTestFile("test.id3v2.mp3") + "/";
   assertEqual(mp3.artist, "jala.Mp3Info");
   return;
};
