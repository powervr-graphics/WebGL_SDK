attribute highp   vec2  inVertex;
attribute mediump vec2  inTexCoord;

uniform mediump mat4  MVPMatrix;

varying mediump vec2  TexCoord;

void main()
{
	gl_Position = MVPMatrix * vec4(inVertex, 0.0, 1.0);
	TexCoord = inTexCoord;
}
