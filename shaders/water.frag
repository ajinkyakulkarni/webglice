precision highp float;

varying float depth;
varying vec4 projected;
varying vec3 worldPosition;
uniform vec3 color;
uniform sampler2D reflection;
uniform sampler2D normalnoise;
uniform vec3 eye;
uniform float time;

#include "sun.glsl"

void main(){
  vec2 uv = vec2(worldPosition.x, worldPosition.z);
  vec4 noise = (texture2D(normalnoise, (uv+vec2(time*0.02, time*0.019))*0.07)) + 
               (texture2D(normalnoise, (uv-vec2(time*0.021, -time*0.022))*0.05)) -1.0;
  vec2 screenPosition = ((vec2(projected)/projected.w) + 1.0) * 0.5;
  vec2 reflectionUV = clamp(screenPosition+vec2(noise.x, noise.y*0.5)*0.05, vec2(0.01), vec2(0.99));
  vec3 reflection = vec3(texture2D(reflection, reflectionUV));

  vec3 eyeNormal = normalize(worldPosition-eye);
  vec3 surfaceNormal = normalize(vec3(0, 1, 0)+vec3(noise.x, 0, noise.y)*0.5);

  float theta1 = abs(dot(eyeNormal, surfaceNormal));
  vec3 rf0 = vec3(0.02, 0.02, 0.02); // realtime rendering, page 236
  
  vec3 reflectance = rf0 + (1.0 - rf0)*pow((1.0 - theta1), 5.0);

  /*float internalIOR = 1.333;
  float externalIOR = 1.0;
  float eta = externalIOR/internalIOR;
  float theta2 = sqrt(1.0 - (eta*eta) * (1.0 - (theta1 * theta1)));
  float rs = (externalIOR * theta1 - internalIOR * theta2) / (externalIOR*theta1 + internalIOR * theta2);
  float rp = (internalIOR * theta1 - externalIOR * theta2) / (internalIOR*theta1 + externalIOR * theta2);
  float reflectance = (rs*rs + rp*rp);*/

  vec3 light = sunLight(surfaceNormal, eyeNormal, 10.0, 5.0, 1.0);

  gl_FragColor = vec4(worldPosition+vec3(noise), 1.0);
  gl_FragColor = vec4((reflection*reflectance)+color*light*1.0, depth);

}