/* sparkleCursor.js */

let lastSparkleTime = 0;        // Track the timestamp of the last sparkle
const SPARKLE_INTERVAL = 40;   // Minimum time (in ms) between sparkles

document.addEventListener("mousemove", function(e) {
  const currentTime = Date.now();
  
  // Only create a sparkle if enough time has passed since the last one
  if (currentTime - lastSparkleTime >= SPARKLE_INTERVAL) {
    lastSparkleTime = currentTime;
    
    // Create a span (the sparkle)
    let sparkle = document.createElement("span");
    sparkle.className = "sparkle-effect";
    
    // Position it at the mouse pointer
    sparkle.style.left = e.pageX + "px";
    sparkle.style.top = e.pageY + "px";

    document.body.appendChild(sparkle);

    // Remove the sparkle after 1 second
    setTimeout(() => {
      sparkle.remove();
    }, 200);
  }
});
