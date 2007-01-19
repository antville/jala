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
 * @fileoverview Fields and methods of the jala.ImageFilter class.
 */


// Define the global namespace for Jala modules
if (!global.jala) {
   global.jala = {};
}


/**
 * Constructs a new ImageFilter object
 * @class  This class provides several image manipulating
 * methods. Most of this filter library is based on filters created
 * by Janne Kipinä for JAlbum. For more information have a look
 * at http://www.ratol.fi/~jakipina/java/
 * @param {Object} arg Either
 <ul>
 <li>an instance of helma.image.ImageWrapper</li>
 <li>the path to the image file as String</li>
 <li>an instance of helma.File representing the image file</li>
 <li>an instance of java.io.File representing the image file</li>
 </ul>
 * @constructor
 */
jala.ImageFilter = function(arg) {
   // private variable containing the buffered image to work on
   var bi;

   /**
    * Transforms an image into a bigger one while mirroring the edges
    * This method is used to apply the filtering up to the edges
    * of an image (otherwise the image would keep an unmodified
    * border).
    * @private
    */
   var getEnlargedImageWithMirroring = function(bi, size) {

      var doFlip = function(bi, sx, sy, dist) {
         var out = new java.awt.image.BufferedImage(bi.getWidth(), bi.getHeight(), bi.getType());
         var transform = java.awt.geom.AffineTransform.getScaleInstance(sx, sy);
         (sx < sy) ? transform.translate(-dist, 0) :  transform.translate(0, -dist);
         var atop = new java.awt.image.AffineTransformOp(transform,
             java.awt.image.AffineTransformOp.TYPE_NEAREST_NEIGHBOR);
         out = atop["filter(java.awt.image.BufferedImage,java.awt.image.BufferedImage)"](bi, null);
         return out;
      }

      var doHorizontalFlip = function(bi) {
         return doFlip(bi, -1, 1, bi.getWidth());
      }

      var doVerticalFlip = function(bi) {
         return doFlip(bi, 1, -1, bi.getHeight());
      }

      var width = bi.getWidth() + 2 * size;
      var height = bi.getHeight() + 2 * size;
      var out = new java.awt.image.BufferedImage(width, height, bi.getType());
      var g = out.createGraphics();
      // due to method overloading exactly define the method to be called
      var func = "drawImage(java.awt.Image,int,int,java.awt.image.ImageObserver)";
      g[func](bi, size, size, null);
      
      var part;
      //top-left corner
      part = bi.getSubimage(0, 0, size, size);
      part = doHorizontalFlip(part);
      part = doVerticalFlip(part);
      g[func](part, 0, 0, null);
      //top-right corner
      part = bi.getSubimage(bi.getWidth()-size, 0, size, size);
      part = doHorizontalFlip(part);
      part = doVerticalFlip(part);
      g[func](part, width-size, 0, null);
      //bottom-left corner
      part = bi.getSubimage(0, bi.getHeight()-size, size, size);
      part = doHorizontalFlip(part);
      part = doVerticalFlip(part);
      g[func](part, 0, height-size, null);
      //bottom-right corner
      part = bi.getSubimage(bi.getWidth()-size, bi.getHeight()-size, size, size);
      part = doHorizontalFlip(part);
      part = doVerticalFlip(part);
      g[func](part, width-size, height-size, null);
      //left border
      part = bi.getSubimage(0, 0, size, bi.getHeight());
      part = doHorizontalFlip(part);
      g[func](part, 0, size, null);
      //right border
      part = bi.getSubimage(bi.getWidth()-size, 0, size, bi.getHeight());
      part = doHorizontalFlip(part);
      g[func](part, width-size, size, null);
      //top border
      part = bi.getSubimage(0, 0, bi.getWidth(), size);
      part = doVerticalFlip(part);
      g[func](part, size, 0, null);
      //bottom border
      part = bi.getSubimage(0, bi.getHeight()-size, bi.getWidth(), size);
      part = doVerticalFlip(part);
      g[func](part, size, height-size, null);
      return out;
   }
   
   /**
    * Factory method for a gaussian blur kernel
    * @return {Object} gaussian blur kernel
    * @type Array
    * @private
    */
   var getGaussianBlurKernel = function(size, standard_deviation) {
      var nominator = 2 * standard_deviation * standard_deviation;
      var kernel = java.lang.reflect.Array.newInstance(java.lang.Float.TYPE, size*size);
      var center = (size - 1) / 2;
      var limit = size - 1;
      var xx, yy;
      var sum = 0;
      var value = 0;
      for (var y=0; y<size; y++) {
         for (var x=0; x<size; x++) {
            if ((y <= center) && (x <= center)) {
               if (x >= y) {
                  //calculate new value
                  xx = center - x;
                  yy = center - y;
                  value = Math.exp(-(xx*xx + yy*yy) / nominator);
                  kernel[(y*size)+x] = value;
                  sum += value;
               } else {
                  //copy existing value
                  value = kernel[(x*size)+y];
                  kernel[(y*size)+x] = value;
                  sum += value;
               }
            } else {
               xx = x;
               yy = y;
               if (yy > center)
                  yy = limit - yy;
               if (xx > center)
                  xx = limit - xx;
               value = kernel[(yy*size)+xx];
               kernel[(y*size)+x] = value;
               sum += value;
            }
         }
      }
      for (var i=0; i<kernel.length; i++) {
         kernel[i] = kernel[i] / sum;
      }
      return kernel;
   }

   /**
    * Factory method for an unsharp mask kernel
    * @return {Object} Unsharp mask kernel
    * @type Array
    * @private
    */
   var getUnsharpMaskKernel = function(size, standard_deviation) {
      var elements = getGaussianBlurKernel(size, standard_deviation);
      var center = ((size * size) - 1) / 2;
      elements[center] = 0;
      var sum = 0;
      for (var i=0; i<elements.length; i++) {
         sum += elements[i];
         elements[i] = -elements[i];
      }
      elements[center] = sum + 1;
      return elements;
   }
   

   /**
    * Factory method for a mean kernel
    * @return {Object} Mean kernel
    * @type Array
    * @private
    */
   var getMeanKernel = function(size) {
      var kernel = java.lang.reflect.Array.newInstance(java.lang.Float.TYPE, size);
      for (var i=0;i<size;i++)
         kernel[i] = 1/size;
      return kernel;
   };

   /**
    * Factory method for a sharpening kernel
    * @return {Object} Sharpening kernel
    * @type Array
    * @private
    */
   var getSharpeningKernel = function(amount) {
      var kernel = java.lang.reflect.Array.newInstance(java.lang.Float.TYPE, 9);
      var corner = 0;
      var side = amount / -50;
      var center = (side * -4.0) + (corner * -4.0) + 1.0;
      kernel[0] = kernel[2] = kernel[6] = kernel[8] = corner;
      kernel[1] = kernel[3] = kernel[5] = kernel[7] = side;
      kernel[4] = center;
      return kernel;
   };

   /**
    * Sharpens the image using a plain sharpening kernel.
    * @param {Number} amount The amount of sharpening to apply
    */
   this.sharpen = function(amount) {
      var DEFAULT = 20;
      var MINIMUM = 1;
      var MAXIMUM = 100;
      // correct argument if necessary
      if (isNaN(Math.min(Math.max(amount, MINIMUM), MAXIMUM)))
         amount = DEFAULT;
      var sharpened = new java.awt.image.BufferedImage(bi.getWidth(), bi.getHeight(), bi.getType());
      var kernel = new java.awt.image.Kernel(3, 3, getSharpeningKernel(amount));
      var cop = new java.awt.image.ConvolveOp(kernel, java.awt.image.ConvolveOp.EDGE_NO_OP, null);
      cop.filter(bi, sharpened);
      bi = sharpened;
      return;
   }
   
   /**
    * Perfoms a gaussian operation (unsharp masking or blurring)
    * on the image using the kernelFactory passed as argument
    * @param {Number} r Radius
    * @param {Number} a Amount
    * @param {Function} kernelFactory Factory method to call for building the kernel
    * @private
    */
   var gaussianOp = function(r, a, kernelFactory) {
      var DEFAULT_RADIUS = 2;
      var MINIMUM_RADIUS = 1;
      var MAXIMUM_RADIUS = 10;
      var DEFAULT_AMOUNT = 15;
      var MINIMUM_AMOUNT = 1;
      var MAXIMUM_AMOUNT = 100;
   
      // correct arguments if necessary
      var radius, amount;
      if (isNaN(radius = Math.min(Math.max(r, MINIMUM_RADIUS), MAXIMUM_RADIUS)))
         radius = DEFAULT_RADIUS;
      if (isNaN(amount = Math.min(Math.max(a, MINIMUM_AMOUNT), MAXIMUM_AMOUNT)))
         amount = DEFAULT_AMOUNT;

      if ((bi.getWidth() < bi.getHeight()) && (radius > bi.getWidth())) {
         radius = bi.getWidth();
      } else if ((bi.getHeight() < bi.getWidth()) && (radius > bi.getHeight())) {
         radius = bi.getHeight();
      }
      
      var size = (radius * 2) + 1;
      var standard_deviation = amount / 20;
      var elements = kernelFactory(size, standard_deviation);
      var large = getEnlargedImageWithMirroring(bi, radius);
      var resultImg = new java.awt.image.BufferedImage(large.getWidth(), large.getHeight(), large.getType());
      
      var kernel = new java.awt.image.Kernel(size, size, elements);
      var cop = new java.awt.image.ConvolveOp(kernel, java.awt.image.ConvolveOp.EDGE_NO_OP, null);
      cop.filter(large, resultImg);
      // replace the buffered image with the sharpened one
      bi = resultImg.getSubimage(radius, radius, bi.getWidth(), bi.getHeight());
      return;
   }
   
   /**
    * Performs an unsharp mask operation on the image
    * @param {Number} r Radius
    * @param {Number} a Amount
    */
   this.unsharpMask = function(r, a) {
      gaussianOp(r, a, getUnsharpMaskKernel);
      return;
   }

   /**
    * Performs a gaussian blur operation on the image
    * @param {Number} r Radius
    * @param {Number} a Amount
    */
   this.gaussianBlur = function(r, a) {
      gaussianOp(r, a, getGaussianBlurKernel);
      return;
   }
   

   /**
    * Returns the image that has been worked on
    * @return An instance of helma.image.ImageWrapper
    * @type helma.image.ImageWrapper
    */
   this.getImage = function() {
      var generator = Packages.helma.image.ImageGenerator.getInstance();
      return new Packages.helma.image.ImageWrapper(bi,
                    bi.getWidth(),
                    bi.getHeight(),
                    generator);
   }

   /**
    * constructor body
    * @ignore
    */
   if (arg instanceof Packages.helma.image.ImageWrapper) {
      bi = arg.getBufferedImage();
   } else {
      if (arg instanceof String) {
         var instream = new java.io.FileInputStream(new java.io.File(arg));
      } else if (arg instanceof helma.File) {
         var instream = new java.io.FileInputStream(new java.io.File(arg.getAbsolutePath()));
      } else if (arg instanceof java.io.File) {
         var instream = new java.io.FileInputStream(arg);
      }
      decoder =  Packages.com.sun.image.codec.jpeg.JPEGCodec.createJPEGDecoder(instream);
      bi = decoder.decodeAsBufferedImage();
   }

   return this;
}
