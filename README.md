# PowerVR Graphics WebGL SDK #
This repository contains the source code for the PowerVR Graphics WebGL SDK. Although the WebGL SDK is written from the ground up in Javascript, it retains the coding style of the native C/C++ PowerVR Graphics OpenGL ES SDK. This should make the code instantly recognisable to programmers who have used our OpenGL ES SDK before.

The WebGL SDK includes an abstraction layer that handles application life-cycle events (Shell), a 3D maths, text printing and resource loading framework (Tools), and a sub-set of the native OpenGL ES SDK's 3D graphics example applications. The SDK has been optimized for PowerVR devices, but should run efficiently on all WebGL capable phones, tablets, laptops and PCs.  

## Setup ##
Many of the WebGL Examples require the code to be hosted on a server. For demonstration purposes, we've used GitHub's [Pages feature](https://pages.github.com/) to host the WebGL SDK. If you fork the code on GitHub, you can use the same mechanism to host your modified code. If you would prefer not to use GitHub, you must host the code on your own web server.

## Examples ##
### Beginner ###
<ol>
<li>01_HelloAPI</li>
<li>02_IntroducingPVRShell</li>
<li>03_Texturing</li>
<li>04_BasicTnL</li>
<li>05_IntroducingPVRTools</li>
<li>06_IntroducingPrint3D</li>
<li>07_IntroducingPOD</li>
</ol>
### Intermediate ###
<ol>
<li>RenderToTexture</li>
</ol>
### Advanced ###
<ol>
<li>Water</li>
</ol>

## License ##
The SDK is distributed under a permissive licence so it can easily be integrated into commercial and non-commercial applications. You can find the license <a href="https://github.com/powervr-graphics/WebGL_SDK/blob/master/LICENSE.txt">here</a>.
