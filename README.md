# WebGL2 screensaver Program

<a href="https://3d-render-five.vercel.app/">Demo</a>

This is a simple screensaver program built on WebGL2, it could be optimized more but it is good enough at the state where it is right now. As I said, it's a simple program, it doesnt shut your computer down or log you out or anything, just saves a screen from burn-in

User guide: Click either F11 or the button on screen to go into screensaver mode, once you want to leave just press any key or move the mouse (if you went into fullscreen via F11, press Esc)

Compatibility: Doesn't work on phones, not mine at least. Should be perfectly fine with all computers, not sure about tablets. Doubt they would work though.

Tech stack:
This is just a webpage with WebGL2 doing the rendering using the GPU, which is usually much better than doing it with the CPU.
Languages used: HTML/CSS/JS/GLSL (very little GLSL, but it is used a bit to do some work on the shaders/buffers)
