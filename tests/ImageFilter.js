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
   "testSharpen",
   "testUnsharpMask",
   "testGaussianBlur"
];

/**
 * Helper method to test jala.ImageFilter. The argument
 * specifies the desired method which will be applied to a
 * source image. Then, the result is compared with a corresponding
 * reference image which was created by the same method beforehand.
 * Because comparing binary images is generally questionable, test
 * errors do not necessarily mean there are flaws in the Jala code  
 * but of course can hint changes in the underlying Java code.
 */
var testImageFilter = function(methodName) {
   var testsDir = jala.Test.getTestsDirectory() + "/";
   var tempPath = testsDir + methodName + ".temp.jpg";

   // Define source and reference images
   var sourceImage = new jala.ImageFilter(testsDir + "/test.jpg");
   var reference = new jala.ImageFilter(testsDir + methodName + ".reference.jpg");

   // Apply the image filter and save the result as file
   sourceImage[methodName]();
   sourceImage.getImage().saveAs(tempPath);

   // Define the result as jala.ImageFilter object again
   // (Necessary because byte data in the file differs generally.)
   var img = new jala.ImageFilter(tempPath);
   
   // Compare the byte data of the result with those of the reference
   var imgBytes = img.getBytes();
   var refBytes = reference.getBytes();
   assertEqual(imgBytes.length, refBytes.length);

   for (var i=0; i<imgBytes.length; i+=1) {
      assertEqual(imgBytes[i], refBytes[i]);
   }

   // Remove the result image file
   (new helma.File(tempPath)).remove();
   return;
};

/**
 * A simple test of the sharpen method of jala.ImageFilter.
 */
var testSharpen = function() {
   testImageFilter("sharpen");
   return;
};

/**
 * A simple test of the unsharpMask method of jala.ImageFilter.
 */
var testUnsharpMask = function() {
   testImageFilter("unsharpMask");
   return;
};

/**
 * A simple test of the gaussianBlur method of jala.ImageFilter.
 */
var testGaussianBlur = function() {
   testImageFilter("gaussianBlur");
   return;
};
