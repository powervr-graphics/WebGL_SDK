/*
	PVRAnimation
*/

EPVRAnimation =
{
	eHasPositionAnimation: 0x01,
	eHasRotationAnimation: 0x02,
	eHasScaleAnimation:    0x04,
	eHasMatrixAnimation:   0x08,
}

function PVRAnimation()
{
	this.data =
	{
		flags: 0,
		numFrames: 0,

		positions: null,
		rotations: null,
		scales:    null,
		matrices:  null,
		positionIndices: null,
		rotationIndices: null,
		scaleIndices:    null,
		matrixIndices:   null,
	}

	this.getTranslationMatrix = function(frame, interp)
	{
		if(this.data.positions != null)
		{
			if(this.data.flags & EPVRAnimation.eHasPositionAnimation)
			{
/*					if(frame >= this.data.numFrames - 1)
					throw new RangeError;		*/ // TODO

				var index0, index1;

				if(this.data.positionIndices != null)
				{
					index0 = this.data.positionIndices[frame + 0];
					index1 = this.data.positionIndices[frame + 1];
				}
				else
				{
					index0 = 3 * (frame + 0);
					index1 = 3 * (frame + 1);
				}

				var p0 = new PVRVector3(this.data.positions[index0+0],
										this.data.positions[index0+1],
										this.data.positions[index0+2]);

				var p1 = new PVRVector3(this.data.positions[index1+0],
										this.data.positions[index1+1],
										this.data.positions[index1+2]);

				var interp = PVRVector3.linearInterpolate(p0, p1, interp);
                return PVRMatrix4x4.createTranslation3D(interp.data[0], interp.data[1], interp.data[2]);
			}
			else
			{
				return PVRMatrix4x4.createTranslation3D(this.data.positions[0], this.data.positions[1], this.data.positions[2]);
			}
		}
		return PVRMatrix4x4.identity();
	}

	this.getRotationMatrix = function(frame, interp)
	{
		if(this.data.rotations)
		{
			if(this.data.flags & EPVRAnimation.eHasRotationAnimation)
			{
/*					if(frame >= this.data.numFrames - 1)
					throw new RangeError;		*/ // TODO

				var index0, index1;

				if(this.data.rotationIndices != null)
				{
					index0 = this.data.rotationIndices[frame + 0];
					index1 = this.data.rotationIndices[frame + 1];
				}
				else
				{
					index0 = 4 * (frame + 0);
					index1 = 4 * (frame + 1);
				}

				var q0 = new PVRQuaternion(this.data.rotations[index0+0],
										   this.data.rotations[index0+1],
										   this.data.rotations[index0+2],
										   this.data.rotations[index0+3]);

				var q1 = new PVRQuaternion(this.data.rotations[index1+0],
										   this.data.rotations[index1+1],
										   this.data.rotations[index1+2],
										   this.data.rotations[index1+3]);

				var q  = PVRQuaternion.sphericalLinearInterpolation(q0, q1, interp);
				return q.toRotationMatrix();
			}
			else
			{
				var q = new PVRQuaternion(this.data.rotations[0],
										  this.data.rotations[1],
										  this.data.rotations[2],
										  this.data.rotations[3]);
				return q.toRotationMatrix();
			}
		}

		return PVRMatrix4x4.identity();
	}

	this.getScalingMatrix = function(frame, interp)
	{
        if(this.data.scales)
        {
            if(this.data.flags & EPVRAnimation.eHasScaleAnimation)
            {
                var index0, index1;
                if(this.data.scaleIndices)
                {
                    index0 = this.data.scaleIndices[frame + 0];
                    index1 = this.data.scaleIndices[frame + 1];
                }
                else
                {
                    index0 = 7 * (frame + 0);
                    index1 = 7 * (frame + 1);
                }

                var s0 = new PVRVector3(this.data.scales[index0+0],
                                        this.data.scales[index0+1],
                                        this.data.scales[index0+2]);

                var s1 = new PVRVector3(this.data.scales[index1+0],
                                        this.data.scales[index1+1],
                                        this.data.scales[index1+2]);

				var v = PVRVector3.linearInterpolate(s0, s1, interp);
			    return PVRMatrix4x4.scale(v.data[0], v.data[1], v.data[2]);
            }
            else
            {
                return PVRMatrix4x4.scale(this.data.scales[0], this.data.scales[1], this.data.scales[2]);
            }
        }

		return PVRMatrix4x4.identity();
	}

	this.getTransformationMatrix = function(frame, interp)
	{
		if(this.data.matrices)
		{
			// TODO
			throw "TODO";
		}
		else
		{
            var m = PVRMatrix4x4.identity();
            var tmp;

            // Translation
            tmp = this.getTranslationMatrix(frame, interp);
            m   = PVRMatrix4x4.matrixMultiply(m, tmp);

            // Rotation
            tmp = this.getRotationMatrix(frame, interp);
            m   = PVRMatrix4x4.matrixMultiply(m, tmp);

            // Scale
            tmp = this.getScalingMatrix(frame, interp);
            m   = PVRMatrix4x4.matrixMultiply(m, tmp);

            return m;
		}
	}
}
