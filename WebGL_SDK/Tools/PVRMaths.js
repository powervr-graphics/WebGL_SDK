/*
	PVRMaths
*/

PVRMaths = {}
PVRMaths.POTHigher = function(original, timesHigher)
{
	if(original == 0 || timesHigher < 0)
	{
		return 0;
	}

	var size = 1;
	while (size < original)
        size *= 2;

	// Keep increasing the POT value until the timesHigher value has been met
	for(var i = 1 ; i < timesHigher; ++i)
		size *= 2;

	return size;
}

PVRMaths.POTLower = function(original, timesLower)
{
	if(original == 0 || timesLower < 0)
	{
		return 0;
	}

	var size = PVRMaths.POTHigher(original, 1);
    size >>= 1;

	// Keep increasing the POT value until the timesHigher value has been met
	for(var i = 1 ; i < timesLower; ++i)
    {
		size >>= 1;
        if(size == 1)
            break;
    }

    return size;
}

PVRMaths.PI = 3.14159265359;

function PVRVector2(x, y)
{
    this.data = new Float32Array(2);
    if(x)
        this.data[0] = x;
    if(y)
        this.data[1] = y;
}

PVRVector2.scalarMultiply = function(a, s)
{
	var v = new PVRVector2();
	v.data[0] = a.data[0] * s;
	v.data[1] = a.data[1] * s;
	return v;
}

PVRVector2.add = function(lhs, rhs)
{
	var v = new PVRVector2();
	v.data[0] = lhs.data[0] + rhs.data[0];
	v.data[1] = lhs.data[1] + rhs.data[1];
	return v;
}

function PVRVector3(x, y, z)
{
	this.data = new Float32Array(3);

	if(x)
		this.data[0] = x;
	if(y)
		this.data[1] = y;
	if(z)
		this.data[2] = z;

	// Public functions
	this.normalise = function()
	{
		var length = Math.sqrt(PVRVector3.dot(this, this));
		if(length != 0)
		{
			length = 1 / length;
			this.data[0] *= length;
			this.data[1] *= length;
			this.data[2] *= length;
		}
	}
}

PVRVector3.linearInterpolate = function(a, b, f)
{
	var v = new PVRVector3();
	v.data[0] = a.data[0] + ((b.data[0] - a.data[0]) * f);
	v.data[1] = a.data[1] + ((b.data[1] - a.data[1]) * f);
	v.data[2] = a.data[2] + ((b.data[2] - a.data[2]) * f);
	return v;
}

PVRVector3.add = function(lhs, rhs)
{
	var v = new PVRVector3();
	v.data[0] = lhs.data[0] + rhs.data[0];
	v.data[1] = lhs.data[1] + rhs.data[1];
	v.data[2] = lhs.data[2] + rhs.data[2];
	return v;
}

PVRVector3.subtract = function(lhs, rhs)
{
	var v = new PVRVector3();
	v.data[0] = lhs.data[0] - rhs.data[0];
	v.data[1] = lhs.data[1] - rhs.data[1];
	v.data[2] = lhs.data[2] - rhs.data[2];
	return v;
}

PVRVector3.dot = function(lhs, rhs)
{
	return  lhs.data[0] * rhs.data[0] +
			lhs.data[1] * rhs.data[1] +
			lhs.data[2] * rhs.data[2];
}

PVRVector3.cross = function(lhs, rhs)
{
	var v = new PVRVector3();
	v.data[0] = lhs.data[1] * rhs.data[2] - lhs.data[2] * rhs.data[1];
	v.data[1] = lhs.data[2] * rhs.data[0] - lhs.data[0] * rhs.data[2];
	v.data[2] = lhs.data[0] * rhs.data[1] - lhs.data[1] * rhs.data[0];
	return v;
}

PVRVector3.matrixMultiply = function(lhs, rhs)
{
	var v = new PVRVector3();
	v.data[0] = lhs.data[0] * rhs.data[0] + lhs.data[1] * rhs.data[1] + lhs.data[2] * rhs.data[2];
	v.data[1] = lhs.data[0] * rhs.data[4] + lhs.data[1] * rhs.data[5] + lhs.data[2] * rhs.data[6];
	v.data[2] = lhs.data[0] * rhs.data[8] + lhs.data[1] * rhs.data[9] + lhs.data[2] * rhs.data[10];
	return v;
}

PVRVector3.scalarMultiply = function(a, s)
{
	var v = new PVRVector3();
	v.data[0] = a.data[0] * s;
	v.data[1] = a.data[1] * s;
	v.data[2] = a.data[2] * s;
	return v;
}

PVRVector3.scalarAdd = function(a, s)
{
	var v = new PVRVector3();
	v.data[0] = a.data[0] + s;
	v.data[1] = a.data[1] + s;
	v.data[2] = a.data[2] + s;
	return v;
}

// PVRVector4
function PVRVector4(x, y, z, w)
{
	this.data = new Float32Array(4);

	if(x)
		this.data[0] = x;
	if(y)
		this.data[1] = y;
	if(z)
		this.data[2] = z;
	if(w)
		this.data[3] = w;

	// Public functions
	this.normalise = function()
	{
		var length = Math.sqrt(PVRVector4.dot(this, this));
		if(length != 0)
		{
			length = 1 / length;
			this.data[0] *= length;
			this.data[1] *= length;
			this.data[2] *= length;
			this.data[3] *= length;
		}
	}
}

PVRVector4.dot = function(lhs, rhs)
{
	return lhs.data[0] * rhs.data[0] +
		   lhs.data[1] * rhs.data[1] +
		   lhs.data[2] * rhs.data[2] +
		   lhs.data[3] * rhs.data[3];
}

PVRVector4.add = function(lhs, rhs)
{
	var v = new PVRVector4();
	v.data[0] = lhs.data[0] + rhs.data[0];
	v.data[1] = lhs.data[1] + rhs.data[1];
	v.data[2] = lhs.data[2] + rhs.data[2];
	v.data[3] = lhs.data[3] + rhs.data[3];
	return v;
}

PVRVector4.scalarMultiply = function(a, s)
{
	var v = new PVRVector4();
	v.data[0] = a.data[0] * s;
	v.data[1] = a.data[1] * s;
	v.data[2] = a.data[2] * s;
	v.data[3] = a.data[3] * s;
	return v;
}

// PVRMatrx3x3
function PVRMatrix3x3()
{
    this.data = new Float32Array(9);
}

PVRMatrix3x3.identity = function()
{
	var m = new PVRMatrix3x3();
	m.data[0] = 1.0;  m.data[3] = 0.0;  m.data[6]  = 0.0;
	m.data[1] = 0.0;  m.data[4] = 1.0;  m.data[7]  = 0.0;
	m.data[2] = 0.0;  m.data[5] = 0.0;  m.data[8]  = 1.0;
    return m;
}

PVRMatrix3x3.createRotationX3D = function(radians)
{
    var m = PVRMatrix3x3.identity();

	var cosineX = Math.cos(radians);
	var sineX   = Math.sin(radians);

	m.data[4] = cosineX;
	m.data[5] = -sineX;
	m.data[7] = sineX;
	m.data[8] = cosineX;

    return m;
}

PVRMatrix3x3.createRotationY3D = function(radians)
{
    var m = PVRMatrix3x3.identity();

	var cosineY = Math.cos(radians);
	var sineY   = Math.sin(radians);

	m.data[0] = cosineY;
	m.data[2] = -sineY;
	m.data[6] = sineY;
	m.data[8] = cosineY;

    return m;
}

PVRMatrix3x3.createRotationZ3D = function(radians)
{
    var m = PVRMatrix3x3.identity();

	var cosineZ = Math.cos(radians);
	var sineZ   = Math.sin(radians);

	m.data[0] = cosineZ;
	m.data[1] = -sineZ;
	m.data[3] = sineZ;
	m.data[4] = cosineZ;

    return m;
}

// PVRMatrix4x4
function PVRMatrix4x4()
{
	this.data = new Float32Array(16);
}

PVRMatrix4x4.identity = function()
{
	var m = new PVRMatrix4x4();
	m.data[0] = 1.0;  m.data[4] = 0.0;  m.data[8]  = 0.0;  m.data[12] = 0.0;
	m.data[1] = 0.0;  m.data[5] = 1.0;  m.data[9]  = 0.0;  m.data[13] = 0.0;
	m.data[2] = 0.0;  m.data[6] = 0.0;  m.data[10] = 1.0;  m.data[14] = 0.0;
	m.data[3] = 0.0;  m.data[7] = 0.0;  m.data[11] = 0.0;  m.data[15] = 1.0;
	return m;
}

PVRMatrix4x4.matrixMultiply = function(lhs, rhs)
{
	var m = new PVRMatrix4x4();
	m.data[0]  = lhs.data[0]*rhs.data[0]  + lhs.data[4]*rhs.data[1]  + lhs.data[8]*rhs.data[2]   + lhs.data[12]*rhs.data[3];
	m.data[1]  = lhs.data[1]*rhs.data[0]  + lhs.data[5]*rhs.data[1]  + lhs.data[9]*rhs.data[2]   + lhs.data[13]*rhs.data[3];
	m.data[2]  = lhs.data[2]*rhs.data[0]  + lhs.data[6]*rhs.data[1]  + lhs.data[10]*rhs.data[2]  + lhs.data[14]*rhs.data[3];
	m.data[3]  = lhs.data[3]*rhs.data[0]  + lhs.data[7]*rhs.data[1]  + lhs.data[11]*rhs.data[2]  + lhs.data[15]*rhs.data[3];

	m.data[4]  = lhs.data[0]*rhs.data[4]  + lhs.data[4]*rhs.data[5]  + lhs.data[8]*rhs.data[6]   + lhs.data[12]*rhs.data[7];
	m.data[5]  = lhs.data[1]*rhs.data[4]  + lhs.data[5]*rhs.data[5]  + lhs.data[9]*rhs.data[6]   + lhs.data[13]*rhs.data[7];
	m.data[6]  = lhs.data[2]*rhs.data[4]  + lhs.data[6]*rhs.data[5]  + lhs.data[10]*rhs.data[6]  + lhs.data[14]*rhs.data[7];
	m.data[7]  = lhs.data[3]*rhs.data[4]  + lhs.data[7]*rhs.data[5]  + lhs.data[11]*rhs.data[6]  + lhs.data[15]*rhs.data[7];

	m.data[8]  = lhs.data[0]*rhs.data[8]  + lhs.data[4]*rhs.data[9]  + lhs.data[8]*rhs.data[10]  + lhs.data[12]*rhs.data[11];
	m.data[9]  = lhs.data[1]*rhs.data[8]  + lhs.data[5]*rhs.data[9]  + lhs.data[9]*rhs.data[10]  + lhs.data[13]*rhs.data[11];
	m.data[10] = lhs.data[2]*rhs.data[8]  + lhs.data[6]*rhs.data[9]  + lhs.data[10]*rhs.data[10] + lhs.data[14]*rhs.data[11];
	m.data[11] = lhs.data[3]*rhs.data[8]  + lhs.data[7]*rhs.data[9]  + lhs.data[11]*rhs.data[10] + lhs.data[15]*rhs.data[11];

	m.data[12] = lhs.data[0]*rhs.data[12] + lhs.data[4]*rhs.data[13] + lhs.data[8]*rhs.data[14]  + lhs.data[12]*rhs.data[15];
	m.data[13] = lhs.data[1]*rhs.data[12] + lhs.data[5]*rhs.data[13] + lhs.data[9]*rhs.data[14]  + lhs.data[13]*rhs.data[15];
	m.data[14] = lhs.data[2]*rhs.data[12] + lhs.data[6]*rhs.data[13] + lhs.data[10]*rhs.data[14] + lhs.data[14]*rhs.data[15];
	m.data[15] = lhs.data[3]*rhs.data[12] + lhs.data[7]*rhs.data[13] + lhs.data[11]*rhs.data[14] + lhs.data[15]*rhs.data[15];
	return m;
}

PVRMatrix4x4.vectorMultiply = function(lhs, rhs)
{
	var v = new PVRVector4();
	v.data[0] = lhs.data[0]*rhs.data[0] + lhs.data[4]*rhs.data[1] + lhs.data[8]*rhs.data[2]  + lhs.data[12]*rhs.data[3];
	v.data[1] = lhs.data[1]*rhs.data[0] + lhs.data[5]*rhs.data[1] + lhs.data[9]*rhs.data[2]  + lhs.data[13]*rhs.data[3];
	v.data[2] = lhs.data[2]*rhs.data[0] + lhs.data[6]*rhs.data[1] + lhs.data[10]*rhs.data[2] + lhs.data[14]*rhs.data[3];
	v.data[3] = lhs.data[3]*rhs.data[0] + lhs.data[7]*rhs.data[1] + lhs.data[11]*rhs.data[2] + lhs.data[15]*rhs.data[3];
	return v;
}

PVRMatrix4x4.scale = function(X, Y, Z)
{
    var m = new PVRMatrix4x4();
	m.data[ 0] = X;		m.data[ 4] = 0.0;	m.data[ 8] = 0.0;	m.data[12] = 0.0;
	m.data[ 1] = 0.0;	m.data[ 5] = Y;		m.data[ 9] = 0.0;	m.data[13] = 0.0;
	m.data[ 2] = 0.0;	m.data[ 6] = 0.0;	m.data[10] = Z;		m.data[14] = 0.0;
	m.data[ 3] = 0.0;	m.data[ 7] = 0.0;	m.data[11] = 0.0;	m.data[15] = 1.0;
    return m;
}

PVRMatrix4x4.translation = function(X, Y, Z)
{
    var m = new PVRMatrix4x4();
	m.data[ 0] = 1.0;	m.data[ 4] = 0.0;	m.data[ 8] = 0.0;	m.data[12] = X;
	m.data[ 1] = 0.0;	m.data[ 5] = 1.0;	m.data[ 9] = 0.0;	m.data[13] = Y;
	m.data[ 2] = 0.0;	m.data[ 6] = 0.0;	m.data[10] = 1.0;	m.data[14] = Z;
	m.data[ 3] = 0.0;	m.data[ 7] = 0.0;	m.data[11] = 0.0;	m.data[15] = 1.0;
    return m;
}

PVRMatrix4x4.multiply = function(lhs, rhs)
{
	if(lhs instanceof PVRMatrix4x4 && rhs instanceof PVRMatrix4x4)
	{
		return PVRMatrix4x4.matrixMultiply(lhs, rhs);
	}
	else if(lhs instanceof PVRMatrix4x4 && rhs instanceof PVRVector4)
	{
		return PVRMatrix4x4.vectorMultiply(lhs, rhs);
	}
	else
	{
		throw "Invalid multiplication operands";
	}
}

PVRMatrix4x4.transpose = function(matrix)
{
    var m = new PVRMatrix4x4();

	                          var r10 = matrix.data[4]; var r20 = matrix.data[8]; var r30 = matrix.data[11];
	var r01 = matrix.data[1];                           var r21 = matrix.data[9]; var r31 = matrix.data[12];
	var r02 = matrix.data[2]; var r12 = matrix.data[6];                           var r32 = matrix.data[13];
	var r03 = matrix.data[3]; var r13 = matrix.data[7]; var r23 = matrix.data[10];


					 m.data[4] = r01; m.data[8] = r02; m.data[11] = r03;
	m.data[1] = r10;                  m.data[9] = r12; m.data[12] = r13;
	m.data[2] = r20; m.data[6] = r21;                  m.data[13] = r23;
	m.data[3] = r30; m.data[7] = r31; m.data[10] = r32;

    return m;
}

PVRMatrix4x4.determinant = function(matrix)
{
	// Uses Laplace Expansion (recursive algorithm) - exponentially expensive for larger matrices.
	// For 4x4 matrices the Laplace expansion has been pre-expanded.
	var determinant;

	// Work out the determinants of all of the 3x3 matrices that can be generated from the bottom 3 rows.
	var subDeterminant = [4];

	// 1st mat3
	subDeterminant[0] = matrix.data[5] * ( (matrix.data[10]* matrix.data[15]) - (matrix.data[14] * matrix.data[11]) ) -
						matrix.data[6] * ( (matrix.data[9] * matrix.data[15]) - (matrix.data[13] * matrix.data[11]) ) +
						matrix.data[7] * ( (matrix.data[9] * matrix.data[14]) - (matrix.data[13] * matrix.data[10]) ) ;

	// 2nd mat3
	subDeterminant[1] = matrix.data[4] * ( (matrix.data[10]* matrix.data[15]) - (matrix.data[14] * matrix.data[11]) ) -
						matrix.data[6] * ( (matrix.data[8] * matrix.data[15]) - (matrix.data[12] * matrix.data[11]) ) +
						matrix.data[7] * ( (matrix.data[8] * matrix.data[14]) - (matrix.data[12] * matrix.data[10]) ) ;

	// 3rd mat3
	subDeterminant[2] = matrix.data[4] * ( (matrix.data[9] * matrix.data[15]) - (matrix.data[13] * matrix.data[11]) ) -
						matrix.data[5] * ( (matrix.data[8] * matrix.data[15]) - (matrix.data[12] * matrix.data[11]) ) +
						matrix.data[7] * ( (matrix.data[8] * matrix.data[13]) - (matrix.data[12] * matrix.data[9]) ) ;

	// 4th mat3
	subDeterminant[3] = matrix.data[4] * ( (matrix.data[9] * matrix.data[14]) - (matrix.data[13] * matrix.data[10]) ) -
						matrix.data[5] * ( (matrix.data[8] * matrix.data[14]) - (matrix.data[12] * matrix.data[10]) ) +
						matrix.data[6] * ( (matrix.data[8] * matrix.data[13]) - (matrix.data[12] * matrix.data[9]) ) ;

	// Combine all the sub determinants with the top row's matrix.data to work out the determinant of the 4x4 matrix.
	determinant = matrix.data[0] * subDeterminant[0] -
				  matrix.data[1] * subDeterminant[1] +
				  matrix.data[2] * subDeterminant[2] -
				  matrix.data[3] * subDeterminant[3];

	return determinant;
}

PVRMatrix4x4.inverse = function(matrix)
{
	// Get the determinant
	var determinant = this.determinant(matrix);

	// Check that the matrix is not singular
	if (determinant == 0)
		return matrix;

	var determinantRecip = 1.0 / determinant;

	var r00,r01,r02,r03;
	var r10,r11,r12,r13;
	var r20,r21,r22,r23;
	var r30,r31,r32,r33;

	// Fill out the Invert matrix, combining all the steps of matrix of minors (determinants), cofactors(signing), Invert and division by the determinant.
	// Row 1
	{
		r00 = ( matrix.data[5] * ( ( matrix.data[10] * matrix.data[15]) - ( matrix.data[14] * matrix.data[11]) ) -
			    matrix.data[6] * ( ( matrix.data[9]  * matrix.data[15]) - ( matrix.data[13] * matrix.data[11]) ) +
			    matrix.data[7] * ( ( matrix.data[9]  * matrix.data[14]) - ( matrix.data[13] * matrix.data[10]) ) )
		* determinantRecip;

		r10 = ( matrix.data[4] * ( ( matrix.data[10] * matrix.data[15]) - ( matrix.data[14] * matrix.data[11]) ) -
			    matrix.data[6] * ( ( matrix.data[8]  * matrix.data[15]) - ( matrix.data[12] * matrix.data[11]) ) +
			    matrix.data[7] * ( ( matrix.data[8]  * matrix.data[14]) - ( matrix.data[12] * matrix.data[10]) ) )
		* -determinantRecip;

		r20 = ( matrix.data[4] * ( ( matrix.data[9]  * matrix.data[15]) - ( matrix.data[13] * matrix.data[11]) ) -
			    matrix.data[5] * ( ( matrix.data[8]  * matrix.data[15]) - ( matrix.data[12] * matrix.data[11]) ) +
			    matrix.data[7] * ( ( matrix.data[8]  * matrix.data[13]) - ( matrix.data[12] * matrix.data[9] ) ) )
		* determinantRecip;

		r30 = ( matrix.data[4] * ( ( matrix.data[9]  * matrix.data[14]) - ( matrix.data[13] * matrix.data[10]) ) -
			    matrix.data[5] * ( ( matrix.data[8]  * matrix.data[14]) - ( matrix.data[12] * matrix.data[10]) ) +
			    matrix.data[6] * ( ( matrix.data[8]  * matrix.data[13]) - ( matrix.data[12] * matrix.data[9] ) ) )
		* -determinantRecip;
	}
	// Row 2
	{
		r01 = ( matrix.data[1] * ( ( matrix.data[10] * matrix.data[15]) - ( matrix.data[14] * matrix.data[11]) ) -
			    matrix.data[2] * ( ( matrix.data[9]  * matrix.data[15]) - ( matrix.data[13] * matrix.data[11]) ) +
			    matrix.data[3] * ( ( matrix.data[9]  * matrix.data[14]) - ( matrix.data[13] * matrix.data[10]) ) )
		* -determinantRecip;

		r11 = ( matrix.data[0] * ( ( matrix.data[10] * matrix.data[15]) - ( matrix.data[14] * matrix.data[11]) ) -
			    matrix.data[2] * ( ( matrix.data[8]  * matrix.data[15]) - ( matrix.data[12] * matrix.data[11]) ) +
			    matrix.data[3] * ( ( matrix.data[8]  * matrix.data[14]) - ( matrix.data[12] * matrix.data[10]) ) )
		* determinantRecip;

		r21 = ( matrix.data[0] * ( ( matrix.data[9]  * matrix.data[15]) - ( matrix.data[13] * matrix.data[11]) ) -
			    matrix.data[1] * ( ( matrix.data[8]  * matrix.data[15]) - ( matrix.data[12] * matrix.data[11]) ) +
			    matrix.data[3] * ( ( matrix.data[8]  * matrix.data[13]) - ( matrix.data[12] * matrix.data[9] ) ) )
		* -determinantRecip;

		r31 = ( matrix.data[0] * ( ( matrix.data[9]  * matrix.data[14]) - ( matrix.data[13] * matrix.data[10]) ) -
			    matrix.data[1] * ( ( matrix.data[8]  * matrix.data[14]) - ( matrix.data[12] * matrix.data[10]) ) +
			    matrix.data[2] * ( ( matrix.data[8]  * matrix.data[13]) - ( matrix.data[12] * matrix.data[9] ) ) )
		* determinantRecip;
	}
	// Row 3
	{
		r02 = ( matrix.data[1] * ( ( matrix.data[6]  * matrix.data[15]) - ( matrix.data[14] * matrix.data[7]) ) -
			    matrix.data[2] * ( ( matrix.data[5]  * matrix.data[15]) - ( matrix.data[13] * matrix.data[7]) ) +
			    matrix.data[3] * ( ( matrix.data[5]  * matrix.data[14]) - ( matrix.data[13] * matrix.data[6]) ) )
		* determinantRecip;

		r12 = ( matrix.data[0] * ( ( matrix.data[6]  * matrix.data[15]) - ( matrix.data[14] * matrix.data[7]) ) -
			    matrix.data[2] * ( ( matrix.data[4]  * matrix.data[15]) - ( matrix.data[12] * matrix.data[7]) ) +
			    matrix.data[3] * ( ( matrix.data[4]  * matrix.data[14]) - ( matrix.data[12] * matrix.data[6]) ) )
		* -determinantRecip;

		r22 = ( matrix.data[0] * ( ( matrix.data[5]  * matrix.data[15]) - ( matrix.data[13] * matrix.data[7]) ) -
			    matrix.data[1] * ( ( matrix.data[4]  * matrix.data[15]) - ( matrix.data[12] * matrix.data[7]) ) +
			    matrix.data[3] * ( ( matrix.data[4]  * matrix.data[13]) - ( matrix.data[12] * matrix.data[5]) ) )
		* determinantRecip;

		r32 = ( matrix.data[0] * ( ( matrix.data[5]  * matrix.data[14]) - ( matrix.data[13] * matrix.data[6]) ) -
			    matrix.data[1] * ( ( matrix.data[4]  * matrix.data[14]) - ( matrix.data[12] * matrix.data[6]) ) +
			    matrix.data[2] * ( ( matrix.data[4]  * matrix.data[13]) - ( matrix.data[12] * matrix.data[5]) ) )
		* -determinantRecip;
	}
	// Row 4
	{
		r03 = ( matrix.data[1] * ( ( matrix.data[6]  * matrix.data[11]) - ( matrix.data[10] * matrix.data[7]) ) -
			    matrix.data[2] * ( ( matrix.data[5]  * matrix.data[11]) - ( matrix.data[9]  * matrix.data[7]) ) +
			    matrix.data[3] * ( ( matrix.data[5]  * matrix.data[10]) - ( matrix.data[9]  * matrix.data[6]) ) )
		* -determinantRecip;

		r13 = ( matrix.data[0] * ( ( matrix.data[6]  * matrix.data[11]) - ( matrix.data[10] * matrix.data[7]) ) -
			    matrix.data[2] * ( ( matrix.data[4]  * matrix.data[11]) - ( matrix.data[8]  * matrix.data[7]) ) +
			    matrix.data[3] * ( ( matrix.data[4]  * matrix.data[10]) - ( matrix.data[8]  * matrix.data[6]) ) )
		* determinantRecip;

		r23 = ( matrix.data[0] * ( ( matrix.data[5]  * matrix.data[11]) - ( matrix.data[9]  * matrix.data[7]) ) -
			    matrix.data[1] * ( ( matrix.data[4]  * matrix.data[11]) - ( matrix.data[8]  * matrix.data[7]) ) +
			    matrix.data[3] * ( ( matrix.data[4]  * matrix.data[9])  - ( matrix.data[8]  * matrix.data[5]) ) )
		* -determinantRecip;

		r33 = ( matrix.data[0] * ( ( matrix.data[5]  * matrix.data[10]) - ( matrix.data[9]  * matrix.data[6]) ) -
			    matrix.data[1] * ( ( matrix.data[4]  * matrix.data[10]) - ( matrix.data[8]  * matrix.data[6]) ) +
			    matrix.data[2] * ( ( matrix.data[4]  * matrix.data[9])  - ( matrix.data[8]  * matrix.data[5]) ) )
		* determinantRecip;
	}

	var m = new PVRMatrix4x4();
	m.data[0] = r00; m.data[4] = r10; m.data[8]  = r20; m.data[12] = r30;
	m.data[1] = r01; m.data[5] = r11; m.data[9]  = r21; m.data[13] = r31;
	m.data[2] = r02; m.data[6] = r12; m.data[10] = r22; m.data[14] = r32;
	m.data[3] = r03; m.data[7] = r13; m.data[11] = r23; m.data[15] = r33;

	return m;
}

PVRMatrix4x4.createTranslation3D = function(x, y, z)
{
	var m = this.identity();

	// Handle vector3 as input
	if(x instanceof PVRVector3 && arguments.length == 1)
	{
		m.data[12] = x.data[0];
		m.data[13] = x.data[1];
		m.data[14] = x.data[2];
	}
	// Handle 3x floats as input
	else
	{
		m.data[12] = x;
		m.data[13] = y;
		m.data[14] = z;
	}
	return m;
}

PVRMatrix4x4.createRotationX3D = function(angle)
{
    var m  = PVRMatrix4x4.identity();
    var m3 = PVRMatrix3x3.createRotationX3D(angle);
    m.data[0]  = m3.data[0];
    m.data[1]  = m3.data[1];
    m.data[2]  = m3.data[2];
    m.data[4]  = m3.data[3];
    m.data[5]  = m3.data[4];
    m.data[6]  = m3.data[5];
    m.data[8]  = m3.data[6];
    m.data[9]  = m3.data[7];
    m.data[10] = m3.data[8];
    return m;
}

PVRMatrix4x4.createRotationY3D = function(angle)
{
    var m  = PVRMatrix4x4.identity();
    var m3 = PVRMatrix3x3.createRotationY3D(angle);
    m.data[0]  = m3.data[0];
    m.data[1]  = m3.data[1];
    m.data[2]  = m3.data[2];
    m.data[4]  = m3.data[3];
    m.data[5]  = m3.data[4];
    m.data[6]  = m3.data[5];
    m.data[8]  = m3.data[6];
    m.data[9]  = m3.data[7];
    m.data[10] = m3.data[8];
    return m;
}

PVRMatrix4x4.createRotationZ3D = function(angle)
{
    var m  = PVRMatrix4x4.identity();
    var m3 = PVRMatrix3x3.createRotationZ3D(angle);
    m.data[0]  = m3.data[0];
    m.data[1]  = m3.data[1];
    m.data[2]  = m3.data[2];
    m.data[4]  = m3.data[3];
    m.data[5]  = m3.data[4];
    m.data[6]  = m3.data[5];
    m.data[8]  = m3.data[6];
    m.data[9]  = m3.data[7];
    m.data[10] = m3.data[8];
    return m;
}

PVRMatrix4x4.createLookAt = function(eye, at, up)
{
	var m = this.identity();
	var forward, upNormalised, side;

	forward = PVRVector3.subtract(eye, at);
	forward.normalise();
	side    = PVRVector3.cross(up, forward);
	side.normalise();
	upNormalised = PVRVector3.cross(forward, side);
	upNormalised.normalise();

	m.data[0] = side.data[0];
	m.data[4] = side.data[1];
	m.data[8] = side.data[2];

	m.data[1] = upNormalised.data[0];
	m.data[5] = upNormalised.data[1];
	m.data[9] = upNormalised.data[2];

	m.data[2]  = forward.data[0];
	m.data[6]  = forward.data[1];
	m.data[10] = forward.data[2];

	var x = -eye.data[0];
	var y = -eye.data[1];
	var z = -eye.data[2];

	m.data[12] = (m.data[0] * x) + (m.data[4] * y) + (m.data[8]  * z) + m.data[12];
	m.data[13] = (m.data[1] * x) + (m.data[5] * y) + (m.data[9]  * z) + m.data[13];
	m.data[14] = (m.data[2] * x) + (m.data[6] * y) + (m.data[10] * z) + m.data[14];
	m.data[15] = (m.data[3] * x) + (m.data[7] * y) + (m.data[11] * z) + m.data[15];

	return m;
}

PVRMatrix4x4.createPerspectiveProjection = function(near, far, fov, aspect)
{
	var m = new PVRMatrix4x4();

	var heightAtDepth = 2.0 * near * Math.tan(fov / 2.0);
	var clipW         = heightAtDepth * aspect;
	var clipH         = heightAtDepth;

	var depth = near - far;

	m.data[0]  = (2 * near) / clipW;
	m.data[5]  = (2 * near) / clipH;
	m.data[10] = (near + far) / depth;
	m.data[14] = (2 * near * far) / depth;
	m.data[11] = -1;

	return m;
}

PVRMatrix4x4.createOrthographicProjection = function(left, top, right, bottom, near, far)
{
    var m = new PVRMatrix4x4();

    var rcplmr = 1.0 / (left - right);
    var rcpbmt = 1.0 / (bottom - top);
    var rcpnmf = 1.0 / (near - far);

    m.data[0]  = -2.0 * rcplmr;
    m.data[5]  = -2.0 * rcpbmt;
    m.data[10] = -2.0 * rcpnmf;
    m.data[12] = (right+left) * rcplmr;
    m.data[13] = (top+bottom) * rcpbmt;
    m.data[14] = (near+far)   * rcpnmf;
    m.data[15] = 1.0;

    return m;
}

// PVRQuaternion
function PVRQuaternion(x, y, z, w)
{
	this.data = new Float32Array(4);

	if(x)
		this.data[0] = x;
	if(y)
		this.data[1] = y;
	if(z)
		this.data[2] = z;
	if(w)
		this.data[3] = w;

	this.toRotationMatrix = function()
	{
		var m = new PVRMatrix4x4();

		m.data[0]  = 1.0 - 2.0 * this.data[1] * this.data[1] - 2.0 * this.data[2] * this.data[2];
		m.data[1]  =       2.0 * this.data[0] * this.data[1] - 2.0 * this.data[2] * this.data[3];
		m.data[2]  =       2.0 * this.data[0] * this.data[2] + 2.0 * this.data[1] * this.data[3];
		m.data[3]  = 0.0;

		m.data[4]  =       2.0 * this.data[0] * this.data[1] + 2.0 * this.data[2] * this.data[3];
		m.data[5]  = 1.0 - 2.0 * this.data[0] * this.data[0] - 2.0 * this.data[2] * this.data[2];
		m.data[6]  =       2.0 * this.data[1] * this.data[2] - 2.0 * this.data[0] * this.data[3];
		m.data[7]  = 0.0;

		m.data[8]  =       2.0 * this.data[0] * this.data[2] - 2.0 * this.data[1] * this.data[3];
		m.data[9]  =       2.0 * this.data[1] * this.data[2] + 2.0 * this.data[0] * this.data[3];
		m.data[10] = 1.0 - 2.0 * this.data[0] * this.data[0] - 2.0 * this.data[1] * this.data[1];
		m.data[11] = 0.0;

		m.data[12] = 0.0;
		m.data[13] = 0.0;
		m.data[14] = 0.0;
		m.data[15] = 1.0;

		return m;
	}
}

PVRQuaternion.sphericalLinearInterpolation = function(a, b, f)
{
	// Find cosine of Angle between Quaternion A and B
	var cosine = PVRVector4.dot(a, b);

	if(cosine < 0.0)
	{
		/*
		<http://www.magic-software.com/Documentation/Quaternions.pdf>

		"It is important to note that the quaternions q and -q represent
		the same rotation... while either quaternion will do, the
		interpolation methods require choosing one over the other.

		"Although q1 and -q1 represent the same rotation, the values of
		Slerp(t; q0, q1) and Slerp(t; q0,-q1) are not the same. It is
		customary to choose the sign... on q1 so that... the angle
		between q0 and q1 is acute. This choice avoids extra
		spinning caused by the interpolated rotations."
		*/

		// So use the inverse of the other quaternion
		var b2 = PVRVector4.scalarMultiply(b, -1.0);

		return PVRQuaternion.sphericalLinearInterpolation(a, b2, f);
	}

	var q = new PVRQuaternion();

	// Ensure the cosine is valid
	cosine = Math.min(cosine, 1.0);

	// Get the angle
	var angle = Math.acos(cosine);
    var p0 = 1.0, p1 = 1.0;
    if(angle > 0.0)
    {
	    // Calculate resultant quaternion
	    p0 = Math.sin((1.0 - f) * angle) / Math.sin(angle);
	    p1 = Math.sin(f * angle) / Math.sin(angle);
    }

	q.data[0] = (a.data[0] * p0) + (b.data[0] * p1);
	q.data[1] = (a.data[1] * p0) + (b.data[1] * p1);
	q.data[2] = (a.data[2] * p0) + (b.data[2] * p1);
	q.data[3] = (a.data[3] * p0) + (b.data[3] * p1);

	return q;
}

PVRQuaternion.createFromAxisAndAngle = function(axis, angle)
{
	// Create the data as a vector
	var a = PVRVector3.scalarMultiply(axis, Math.sin(angle / 2.0));
	var v = new PVRVector4(a.data[0], a.data[1], a.data[2], Math.cos(angle / 2.0));
	v.normalise();

	var q = new PVRQuaternion(v.data[0], v.data[1], v.data[2], v.data[3]);
	return q;
}
