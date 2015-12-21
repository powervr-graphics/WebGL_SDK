/*
	PVRFileStream
*/

EPVRFileStreamSeekMode =
{
	eFromStart   : 1,
	eFromCurrent : 2,
}

function PVRFileStream()
{
	this.offset       = 0;
	this.buffer       = null;
    this.raw          = null;
	this.littleEndian = false;

	this.Open = function (uri, littleEndian, completionFunc)
	{
		var args = [this];
		args     = args.concat(Array.prototype.slice.call(arguments, 3));

		var req = new XMLHttpRequest();
		req.open('GET', uri);
		req.responseType = "arraybuffer";
		req.callback     = completionFunc;
		req.arguments    = args;
		req.onload       = function(e)
		{
			if(req.readyState == 4)
			{
				var stream        = this.arguments[0];
                stream.raw        = this.response.slice(0);
				stream.buffer     = new DataView(stream.raw);
				this.callback.apply(null, args);
			}
		};
		req.onerror       = function(e)
		{
			console.error(this.statusText);
		}

		this.littleEndian = littleEndian;

		req.send();
	}

	this.IsOpen = function ()
	{
		return this.buffer != null;
	}

	this.GetPosition = function ()
	{
		return this.offset;
	}

	this.GetSize = function ()
	{
		return this.buffer.byteLength;
	}

	this.Seek = function (offset, mode)
	{
		if(mode == EPVRFileStreamSeekMode.eFromStart)
		{
			if(offset > this.buffer.byteLength)
				return false;

			this.offset = offset;
		}
		else if(mode == EPVRFileStreamSeekMode.eFromCurrent)
		{
			if(this.offset + offset > this.buffer.byteLength)
				return false;

			this.offset += offset;
		}
		return true;
	}

	/*
		Int8
	*/
	this.ReadInt8 = function (offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var v  = this.buffer.getInt8(offset);
		this.offset = offset + 1;
		return v;
	}

	/*
		Uint8 / Bytes
	*/
	this.ReadUInt8 = function (offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var v  = this.buffer.getUint8(offset);
		this.offset = offset + 1;
		return v;
	}

	this.ReadArrayBuffer = function (count, offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var buff  = this.raw.slice(offset, offset + count);
		this.offset += count;
		return buff;
	}

	this.ReadByteArray = function (count, offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var vA = new Array();
		for(var i = 0; i < count; i++)
		{
			vA[i] = this.buffer.getUint8(offset, this.littleEndian);
			offset++;
		}
		this.offset = offset;
		return new Uint8Array(vA);
	}

	/*
		Int16
	*/
	this.ReadInt16 = function (offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var v  = this.buffer.getInt16(offset, this.littleEndian);
		this.offset = offset + 2;
		return v;
	}

	/*
		Uint16
	*/
	this.ReadUInt16 = function (offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var v  = this.buffer.getUint16(offset, this.littleEndian);
		this.offset = offset + 2;
		return v;
	}

	this.ReadUInt16Array = function (count, offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var vA = new Array();
		for(var i = 0; i < count; i++)
		{
			vA[i] = this.buffer.getUint16(offset, this.littleEndian);
			offset += 2;
		}
		this.offset = offset;
		return new Uint16Array(vA);
	}

	/*
		Int32
	*/
	this.ReadInt32 = function (offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var v  = this.buffer.getInt32(offset, this.littleEndian);
		this.offset = offset + 4;
		return v;
	}

	this.ReadInt32Array = function (count, offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var vA = new Array();
		for(var i = 0; i < count; i++)
		{
			vA[i] = this.buffer.getInt32(offset, this.littleEndian);
			offset += 4;
		}
		this.offset = offset;
		return new Int32Array(vA);
	}

	/*
		Uint32
	*/
	this.ReadUInt32 = function (offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var v  = this.buffer.getUint32(offset, this.littleEndian);
		this.offset = offset + 4;
		return v;
	}

	this.ReadUInt32Array = function (count, offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var vA = new Array();
		for(var i = 0; i < count; i++)
		{
			vA[i] = this.buffer.getUint32(offset, this.littleEndian);
			offset += 4;
		}
		this.offset = offset;
		return new Uint32Array(vA);
	}

	/*
		Float32
	*/
	this.ReadFloat32 = function (offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var v  = this.buffer.getFloat32(offset, this.littleEndian);
		this.offset = offset + 4;
		return v;
	}

	this.ReadFloat32Array = function (count, offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var vA = new Array();
		for(var i = 0; i < count; i++)
		{
			vA[i] = this.buffer.getFloat32(offset, this.littleEndian);
			offset += 4;
		}
		this.offset = offset;
		return new Float32Array(vA);
	}

	/*
		Float64
	*/
	this.ReadFloat64 = function (offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var v  = this.buffer.getFloat64(offset, this.littleEndian);
		this.offset = offset + 8;
		return v;
	}

	/*
		String
	*/
	this.ReadString = function (length, offset)
	{
		offset = (typeof offset === "undefined") ? this.offset : offset;
		var v = "";
		for(var i = 0; i < length; i++)
		{
			var c = this.buffer.getUint8(offset+i);
			if(c != 0)
				v += String.fromCharCode(c);
		}
		this.offset = offset + length;
		return v;
	}
}
