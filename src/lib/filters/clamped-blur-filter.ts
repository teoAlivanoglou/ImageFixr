import {
	Filter,
	GlProgram,
	GpuProgram,
	TexturePool,
	RendererType,
	type FilterOptions
} from 'pixi.js';

const GAUSSIAN_VALUES: Record<number, number[]> = {
	5: [0.153388, 0.221461, 0.250301],
	7: [0.071303, 0.131514, 0.189879, 0.214607],
	9: [0.028532, 0.067234, 0.124009, 0.179044, 0.20236],
	11: [0.0093, 0.028002, 0.065984, 0.121703, 0.175713, 0.198596],
	13: [0.002406, 0.009255, 0.027867, 0.065666, 0.121117, 0.174868, 0.197641],
	15: [0.000489, 0.002403, 0.009246, 0.02784, 0.065602, 0.120999, 0.174697, 0.197448]
};

const vertTemplate = `
in vec2 aPosition;
uniform float uStrength;
out vec2 vBlurTexCoords[%size%];

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void) {
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void) {
    gl_Position = filterVertexPosition();
    float pixelStrength = uInputSize.%dimension% * uStrength;
    vec2 textureCoord = filterTextureCoord();
%blur%
}
`;

function generateClampedBlurGlProgram(horizontal: boolean, kernelSize: number): GlProgram {
	const halfLength = Math.ceil(kernelSize / 2);
	let vertSource = vertTemplate;
	let blurLoop = '';
	const template = horizontal
		? '    vBlurTexCoords[%index%] = textureCoord + vec2(%sampleIndex% * pixelStrength, 0.0);'
		: '    vBlurTexCoords[%index%] = textureCoord + vec2(0.0, %sampleIndex% * pixelStrength);';

	for (let i = 0; i < kernelSize; i++) {
		let blur = template.replace('%index%', i.toString());
		blur = blur.replace('%sampleIndex%', `${i - (halfLength - 1)}.0`);
		blurLoop += `${blur}\n`;
	}

	vertSource = vertSource
		.replace('%blur%', blurLoop)
		.replace('%size%', kernelSize.toString())
		.replace('%dimension%', horizontal ? 'z' : 'w');

	const kernel = GAUSSIAN_VALUES[kernelSize] || GAUSSIAN_VALUES[5];
	const kernelHalfLength = kernel.length;
	let fragBlurLoop = '';
	for (let i = 0; i < kernelSize; i++) {
		const prefix = i === 0 ? '    finalColor = ' : '        + ';
		const valueIndex = i < kernelHalfLength ? i : kernelSize - i - 1;
		const weight = kernel[valueIndex];
		fragBlurLoop += `${prefix}texture(uTexture, mirrorUV(vBlurTexCoords[${i}], uInputClamp.xy, uInputClamp.zw)) * ${weight}\n`;
	}

	const fragSource = `
in vec2 vBlurTexCoords[${kernelSize}];
uniform sampler2D uTexture;
uniform vec4 uInputClamp;
out vec4 finalColor;

vec2 mirrorUV(vec2 uv, vec2 minBound, vec2 maxBound) {
    vec2 span = maxBound - minBound;
    vec2 period = 2.0 * span;
    vec2 rel = uv - minBound;
    vec2 m = mod(rel, period);
    if (m.x < 0.0) m.x += period.x;
    if (m.y < 0.0) m.y += period.y;
    vec2 mirrored = minBound + mix(m, period - m, step(span, m));
    return clamp(mirrored, minBound, maxBound);
}

void main(void) {
${fragBlurLoop};
}
`;

	return GlProgram.from({
		vertex: vertSource,
		fragment: fragSource,
		name: `clamped-blur-${horizontal ? 'h' : 'v'}-${kernelSize}`
	});
}

const wgslTemplate = `
struct GlobalFilterUniforms {
  uInputSize:vec4<f32>,
  uInputPixel:vec4<f32>,
  uInputClamp:vec4<f32>,
  uOutputFrame:vec4<f32>,
  uGlobalFrame:vec4<f32>,
  uOutputTexture:vec4<f32>,
};

struct BlurUniforms {
  uStrength:f32,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler : sampler;

@group(1) @binding(0) var<uniform> blurUniforms : BlurUniforms;

struct VSOutput {
    @builtin(position) position: vec4<f32>,
    %blur-struct%
};

fn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32> {
    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;
    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

fn filterTextureCoord(aPosition:vec2<f32>) -> vec2<f32> {
    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
}

fn mirrorUV(uv: vec2<f32>, minBound: vec2<f32>, maxBound: vec2<f32>) -> vec2<f32> {
    let span = maxBound - minBound;
    let period = 2.0 * span;
    let rel = uv - minBound;
    let m = rel - period * floor(rel / period);
    let isSecondHalf = step(span, m);
    let mirrored = minBound + mix(m, period - m, isSecondHalf);
    return clamp(mirrored, minBound, maxBound);
}

@vertex
fn mainVertex(
  @location(0) aPosition : vec2<f32>,
) -> VSOutput {
  let filteredCord = filterTextureCoord(aPosition);
  let pixelStrength = gfu.uInputSize.%dimension% * blurUniforms.uStrength;
  return VSOutput(
    filterVertexPosition(aPosition),
    %blur-vertex-out%
  );
}

@fragment
fn mainFragment(
  @builtin(position) position: vec4<f32>,
  %blur-fragment-in%
) -> @location(0) vec4<f32> {
    var finalColor = vec4(0.0);
    %blur-sampling%
    return finalColor;
}
`;

function generateClampedBlurGpuProgram(horizontal: boolean, kernelSize: number): GpuProgram {
	const kernel = GAUSSIAN_VALUES[kernelSize] || GAUSSIAN_VALUES[5];
	const halfLength = kernel.length;
	const blurStructSource: string[] = [];
	const blurOutSource: string[] = [];
	const blurSamplingSource: string[] = [];

	for (let i = 0; i < kernelSize; i++) {
		blurStructSource[i] = `@location(${i}) offset${i}: vec2<f32>,`;
		if (horizontal) {
			blurOutSource[i] = `filteredCord + vec2(${i - halfLength + 1}.0 * pixelStrength, 0.0),`;
		} else {
			blurOutSource[i] = `filteredCord + vec2(0.0, ${i - halfLength + 1}.0 * pixelStrength),`;
		}
		const kernelIndex = i < halfLength ? i : kernelSize - i - 1;
		const kernelValue = kernel[kernelIndex].toString();
		blurSamplingSource[i] = `finalColor += textureSample(uTexture, uSampler, mirrorUV(offset${i}, gfu.uInputClamp.xy, gfu.uInputClamp.zw)) * ${kernelValue};`;
	}

	const finalSource = wgslTemplate
		.replace('%blur-struct%', blurStructSource.join('\n'))
		.replace('%blur-vertex-out%', blurOutSource.join('\n'))
		.replace('%blur-fragment-in%', blurStructSource.join('\n'))
		.replace('%blur-sampling%', blurSamplingSource.join('\n'))
		.replace('%dimension%', horizontal ? 'z' : 'w');

	return GpuProgram.from({
		vertex: { source: finalSource, entryPoint: 'mainVertex' },
		fragment: { source: finalSource, entryPoint: 'mainFragment' }
	});
}

export interface ClampedBlurFilterOptions extends FilterOptions {
	strength?: number;
	quality?: number;
	kernelSize?: number;
	horizontal?: boolean;
}

export class ClampedBlurFilterPass extends Filter {
	horizontal: boolean;
	passes = 4;
	private _strength = 0;
	private _blurUniforms: { uniforms: { uStrength: number } };

	constructor(options: ClampedBlurFilterOptions = {}) {
		const horizontal = options.horizontal ?? true;
		const kernelSize = options.kernelSize ?? 5;
		const quality = options.quality ?? 4;
		const strength = options.strength ?? 8;

		const glProgram = generateClampedBlurGlProgram(horizontal, kernelSize);
		const gpuProgram = generateClampedBlurGpuProgram(horizontal, kernelSize);

		super({
			glProgram,
			gpuProgram,
			resources: {
				blurUniforms: {
					uStrength: { value: 0, type: 'f32' }
				}
			},
			...options
		});

		this.horizontal = horizontal;
		this.passes = quality;
		this._blurUniforms = this.resources.blurUniforms as any;
		this.blur = strength;
		this.padding = 0;
	}

	get blur(): number {
		return this._strength;
	}

	set blur(value: number) {
		this._strength = value;
		this.padding = 0;
		this.enabled = value > 0;
	}

	get quality(): number {
		return this.passes;
	}

	set quality(value: number) {
		this.passes = value;
	}

	private _calculateInitialStrength(): number {
		let sumOfSquares = 1;
		let coefficient = 0.5;
		for (let i = 1; i < this.passes; i++) {
			sumOfSquares += coefficient * coefficient;
			coefficient *= 0.5;
		}
		return this._strength / Math.sqrt(sumOfSquares);
	}

	apply(filterManager: any, input: any, output: any, clearMode: any): void {
		if (this._strength <= 0) {
			return;
		}

		const uniforms = this._blurUniforms.uniforms;
		uniforms.uStrength = this._calculateInitialStrength();

		if (this.passes === 1) {
			filterManager.applyFilter(this, input, output, clearMode);
		} else {
			const tempTexture = TexturePool.getSameSizeTexture(input);
			let flip = input;
			let flop = tempTexture;
			this._state.blend = false;
			const renderer = filterManager.renderer;
			const isWebGPU = renderer.type === RendererType.WEBGPU;
			const uboBatcher = isWebGPU ? renderer.renderPipes.uniformBatch : null;

			for (let i = 0; i < this.passes - 1; i++) {
				if (uboBatcher) {
					this.groups[1].setResource(uboBatcher.getUboResource(this._blurUniforms), 0);
				}
				filterManager.applyFilter(this, flip, flop, isWebGPU);
				const temp = flop;
				flop = flip;
				flip = temp;
				uniforms.uStrength *= 0.5;
			}

			if (uboBatcher) {
				this.groups[1].setResource(uboBatcher.getUboResource(this._blurUniforms), 0);
			}
			this._state.blend = true;
			filterManager.applyFilter(this, flip, output, clearMode);
			TexturePool.returnTexture(tempTexture);
		}
	}
}

export class ClampedBlurFilter extends Filter {
	blurXFilter: ClampedBlurFilterPass;
	blurYFilter: ClampedBlurFilterPass;

	constructor(options: ClampedBlurFilterOptions = {}) {
		const { strength = 0, quality = 4, kernelSize = 5, ...rest } = options;
		super({
			...rest,
			compatibleRenderers: RendererType.BOTH,
			resources: {}
		});

		this.blurXFilter = new ClampedBlurFilterPass({
			horizontal: true,
			strength,
			quality,
			kernelSize
		});
		this.blurYFilter = new ClampedBlurFilterPass({
			horizontal: false,
			strength,
			quality,
			kernelSize
		});

		this.padding = 0;
		this.strength = strength;
	}

	apply(filterManager: any, input: any, output: any, clearMode: any): void {
		const xStrength = Math.abs(this.blurXFilter.blur);
		const yStrength = Math.abs(this.blurYFilter.blur);

		if (xStrength <= 0 && yStrength <= 0) {
			return;
		}

		if (xStrength && yStrength) {
			const tempTexture = TexturePool.getSameSizeTexture(input);
			this.blurXFilter.blendMode = 'normal';
			this.blurXFilter.apply(filterManager, input, tempTexture, true);
			this.blurYFilter.blendMode = this.blendMode;
			this.blurYFilter.apply(filterManager, tempTexture, output, clearMode);
			TexturePool.returnTexture(tempTexture);
		} else if (yStrength) {
			this.blurYFilter.blendMode = this.blendMode;
			this.blurYFilter.apply(filterManager, input, output, clearMode);
		} else if (xStrength) {
			this.blurXFilter.blendMode = this.blendMode;
			this.blurXFilter.apply(filterManager, input, output, clearMode);
		}
	}

	get strength(): number {
		return this.blurXFilter.blur;
	}

	set strength(value: number) {
		this.blurXFilter.blur = value;
		this.blurYFilter.blur = value;
		this.padding = 0;
		this.enabled = value > 0;
	}

	get quality(): number {
		return this.blurXFilter.quality;
	}

	set quality(value: number) {
		this.blurXFilter.quality = value;
		this.blurYFilter.quality = value;
	}
}
