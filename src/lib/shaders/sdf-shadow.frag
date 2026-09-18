precision highp float;

in vec2 vUV;
out vec4 finalColor;

uniform vec2 uQuadSize;
uniform vec2 uBoxHalfSize;
uniform float uBlur;
uniform float uAlpha;
uniform float uSpread;
uniform vec2 uOffset;
uniform vec3 uShadowColor;

// High-precision Gaussian error function (erf)
float erf(float x) {
    float s = sign(x);
    float a = abs(x);
    float t = 1.0 / (1.0 + 0.3275911 * a);
    float poly = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
    return s * (1.0 - poly * exp(-a * a));
}

// 1D Gaussian integral of box from -halfSize to +halfSize
float gaussianBox1D(float p, float halfSize, float sigma) {
    float invSigmaSqrt2 = 1.0 / (max(sigma, 0.001) * 1.41421356);
    return 0.5 * (erf((p + halfSize) * invSigmaSqrt2) - erf((p - halfSize) * invSigmaSqrt2));
}

void main() {
    vec2 p = (vUV - 0.5) * uQuadSize;

    vec2 shadowPos = p - uOffset;
    vec2 shadowBox = max(uBoxHalfSize + vec2(uSpread), vec2(0.0));
    float sigma = max(uBlur * 0.5, 0.001);
    float shadowAlpha = gaussianBox1D(shadowPos.x, shadowBox.x, sigma) * 
                        gaussianBox1D(shadowPos.y, shadowBox.y, sigma) * uAlpha;

    finalColor = vec4(uShadowColor * shadowAlpha, shadowAlpha);
}
