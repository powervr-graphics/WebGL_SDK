/******************************************************************************

 @File         PVRMapFileIO.cpp

 @Title        libPVRNavigation

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements utilities for navigation maps.

******************************************************************************/

#include "PVRMapFileIO.h"
#include "PVRMapTypes.h"

#ifdef _WIN32
#include <windows.h>
#include <direct.h>
#endif

#include <sys/stat.h>
#include <limits.h>

#include <fstream>
using namespace std;

namespace pvrnavigation
{
//
// Forward declarations
//
bool checkVersion(istream &file);
bool checkSecurityCheckpoint(istream &file);

void writeIndexSet(std::ofstream &file, const PVRTIndexSet &indexset);
bool readIndexSet(std::istream &file, PVRTIndexSet &indexset);

bool writeRenderIndexSet(std::ofstream &file, const PVRTRenderIndexSet &indexset);
bool readRenderIndexSet(std::istream &file, PVRTRenderIndexSet &indexset);

void writeBoundingBox(std::ofstream &file, const PVRTBoundingBox2D &bbox);
void readBoundingBox(std::istream &file, PVRTBoundingBox2D &bbox);

void writeLinestripVector(std::ofstream &file, const PVRTLinestripVector &linestrips);
void readLinestripVector(std::istream &file, PVRTLinestripVector &linestrips);

void writeBucketIndexSet(std::ofstream &file, const PVRTBucketIndexSet &indexset);
bool readBucketIndexSet(std::istream &file, PVRTBucketIndexSet &indexset);
void writeBucketIndexSetVector(std::ofstream &file, const PVRTBucketIndexSetVector &indexsets);
bool readBucketIndexSetVector(std::istream &file, PVRTBucketIndexSetVector &indexsets);

void writePolygonVector(std::ofstream &file, const PVRTPolygonVector &polygons);
void readPolygonVector(std::istream &file, PVRTPolygonVector &polygons);

void writeMultiPolygonVector(std::ofstream &file, const PVRTMultiPolygonVector &polygons);
void readMultiPolygonVector(std::istream &file, PVRTMultiPolygonVector &polygons);

bool writeCoordinateBucket(std::ofstream &file, const PVRTCoordinateBucket &bucket);
bool readCoordinateBucket(std::istream &file, PVRTCoordinateBucket &bucket);

bool writeCoordinateBucketVector(std::ofstream &file, const PVRTCoordinateBucketVector &buckets);
bool readCoordinateBucketVector(std::istream &file, PVRTCoordinateBucketVector &buckets);

template<typename T> void writeVector(std::ofstream &file, const std::vector<T> &data);
template<typename T> void writeRawVector(std::ofstream &file, const std::vector<T> &data);
template<typename T> void readVector(std::istream &file, std::vector<T> &data);
template<typename T> void readRawVector(std::istream &file, std::vector<T> &data);

//
// Definitions used for file content flags and debugging
//
static unsigned int MAPFILEIO_SECURITYCHECKPOINT = 0xFACEBEED;
static unsigned int MAPFILEIO_VERSION = 1;

#define PVRT_INDEXSET_CONTAINS_LINESTRIPS    (1)
#define PVRT_INDEXSET_CONTAINS_POLYGONS      (1 << 1)
#define PVRT_INDEXSET_CONTAINS_TRIANGLES     (1 << 2)
#define PVRT_INDEXSET_CONTAINS_POINTS        (1 << 3)
#define PVRT_INDEXSET_CONTAINS_PIVOTQUADS    (1 << 6)
#define PVRT_INDEXSET_CONTAINS_SIGNS         (1 << 7)
#define PVRT_INDEXSET_CONTAINS_TEXTS         (1 << 8)
#define PVRT_INDEXSET_CONTAINS_MULTIPOLYGONS (1 << 9)


//************************************************************************************
//************************************************************************************
//*****              Intermediate format marshalling functions
//************************************************************************************
//************************************************************************************

unsigned int calculateIndexSetBitMask(const PVRTIndexSet &indexset)
{
	unsigned int bitmask = 0;

	if (!indexset.linestrips.empty())   bitmask |= PVRT_INDEXSET_CONTAINS_LINESTRIPS;
	if (!indexset.polygons.empty())     bitmask |= PVRT_INDEXSET_CONTAINS_POLYGONS;
	if (!indexset.triangles.empty())    bitmask |= PVRT_INDEXSET_CONTAINS_TRIANGLES;
	if (!indexset.points.empty())       bitmask |= PVRT_INDEXSET_CONTAINS_POINTS;	
	if (!indexset.pivotquadtriangles.empty())  bitmask |= PVRT_INDEXSET_CONTAINS_PIVOTQUADS;
	if (!indexset.signs.empty())        bitmask |= PVRT_INDEXSET_CONTAINS_SIGNS;
	if (!indexset.texts.empty())        bitmask |= PVRT_INDEXSET_CONTAINS_TEXTS;
	if (!indexset.multipolygons.empty()) bitmask |= PVRT_INDEXSET_CONTAINS_MULTIPOLYGONS;

	return bitmask;
}

void writeSecurityCheckpoint(ofstream &file)
{
	file.write((char*)&MAPFILEIO_SECURITYCHECKPOINT, sizeof(unsigned int));
}

bool checkSecurityCheckpoint(istream &file)
{
	unsigned int checkpoint;
	file.read((char*)&checkpoint, sizeof(unsigned int));
	return (checkpoint == MAPFILEIO_SECURITYCHECKPOINT);
}

void writeVersion(ofstream &file)
{
	file.write((char*)&MAPFILEIO_VERSION, sizeof(unsigned int));
}

bool checkVersion(istream &file)
{
	unsigned int version;
	file.read((char*)&version, sizeof(unsigned int));

	return (version == MAPFILEIO_VERSION);
}

/*************************************
    MapLayer File layout
	{
	VERSION
	PVRTBoundingBox2D      boundingbox;
	CHECKPOINT
	PVRTCoordinateVector   coordinates;	
	CHECKPOINT
	PVRTIndexSet           indexset
	CHECKPOINT
	};
*************************************/
bool writeMapLayer(const char *pszFilename, const PVRTMapLayer &layer)
{
	ofstream file(pszFilename, ios::binary);
	if (!file.is_open())
		return false;
	
	writeVersion(file);
	writeBoundingBox(file, layer.boundingbox);
	writeSecurityCheckpoint(file);
	writeVector<PVRTVertex>(file, layer.coordinates);
	writeSecurityCheckpoint(file);
	writeIndexSet(file, layer.indexset);	
	writeSecurityCheckpoint(file);
	
	file.close();
	return true;
}

bool readMapLayer(const char *pszFilename, PVRTMapLayer &layer)
{
	ifstream file(pszFilename, ios::binary);
	if (!file.is_open())
		return false;

	if (!checkVersion(file)) return false;
	readBoundingBox(file, layer.boundingbox);
	if (!checkSecurityCheckpoint(file)) return false;
	readVector<PVRTVertex>(file, layer.coordinates);
	if (!checkSecurityCheckpoint(file)) return false;
	readIndexSet(file, layer.indexset);
	if (!checkSecurityCheckpoint(file)) return false;

	file.close();
	return true;
}

/*************************************
	BucketMapLayer File layout
	{
	VERSION
	PVRTBoundingBox2D          boundingbox;
	CHECKPOINT
	PVRTCoordinateBucketVector coordinatebuckets;
	CHECKPOINT	
	PVRTBucketIndexSetVector   bucketindexsets;
	CHECKPOINT
	};
*************************************/
bool writeBucketMapLayer(const char *pszFilename, const PVRTBucketMapLayer &layer)
{
	ofstream file(pszFilename, ios::binary);
	if (!file.is_open())
		return false;
	
	writeVersion(file);
	writeBoundingBox(file, layer.boundingbox);
	writeSecurityCheckpoint(file);
	
	if (!writeCoordinateBucketVector(file, layer.coordinatebuckets)) return false;
	writeSecurityCheckpoint(file);
	writeBucketIndexSetVector(file, layer.bucketindexsets);
	writeSecurityCheckpoint(file);
		
	file.close();
	return true;
}

bool readBucketMapLayer(const char *pszFilename, PVRTBucketMapLayer &layer)
{
	ifstream file(pszFilename, ios::binary);
	if (!file.is_open())
		return false;

	return readBucketMapLayer(file, layer);
}

bool readBucketMapLayer(istream &file, PVRTBucketMapLayer &layer)
{
	if (!checkVersion(file)) return false;
	readBoundingBox(file, layer.boundingbox);
	if (!checkSecurityCheckpoint(file)) return false;
	if (!readCoordinateBucketVector(file, layer.coordinatebuckets)) return false;
	if (!checkSecurityCheckpoint(file)) return false;
	readBucketIndexSetVector(file, layer.bucketindexsets);
	if (!checkSecurityCheckpoint(file)) return false;

	return true;
}


/*************************************
    IndexSet File layout
	{
	unsigned int      bitmask;
	CHECKPOINT
	LinestripVector   linestrips;	
	CHECKPOINT
	PolygonVector     polygons;
	CHECKPOINT
	TriangleVector    triangles;
	CHECKPOINT
	PointVector       points;
	CHECKPOINT	
	PVRTTriangleVector letter_indices;
	CHECKPOINT
	PVRTSignVector    signs;
	CHECKPOINT
	PVRTTextVector    texts;
	CHECKPOINT
	};
*************************************/
void writeIndexSet(std::ofstream &file, const PVRTIndexSet &indexset)
{		
	unsigned int bitmask = calculateIndexSetBitMask(indexset);
	file.write((const char*)&bitmask, sizeof(bitmask));
	writeSecurityCheckpoint(file);

	if (bitmask & PVRT_INDEXSET_CONTAINS_LINESTRIPS)
	{
		writeLinestripVector(file, indexset.linestrips);
		writeSecurityCheckpoint(file);
	}

	if (bitmask & PVRT_INDEXSET_CONTAINS_POLYGONS)
	{
		writePolygonVector(file, indexset.polygons);
		writeSecurityCheckpoint(file);
	}

	if (bitmask & PVRT_INDEXSET_CONTAINS_MULTIPOLYGONS)
	{
		writeMultiPolygonVector(file, indexset.multipolygons);
		writeSecurityCheckpoint(file);
	}

	if (bitmask & PVRT_INDEXSET_CONTAINS_TRIANGLES)
	{
		writeVector<PVRTTriangle>(file, indexset.triangles);
		writeSecurityCheckpoint(file);
	}

	if (bitmask & PVRT_INDEXSET_CONTAINS_POINTS)
	{
		writeVector<index_t>(file, indexset.points);
		writeSecurityCheckpoint(file);
	}

	if (bitmask & PVRT_INDEXSET_CONTAINS_PIVOTQUADS)
	{		
		writeVector<PVRTTriangle>(file, indexset.pivotquadtriangles);
		writeSecurityCheckpoint(file);
	}	

	if (bitmask & PVRT_INDEXSET_CONTAINS_SIGNS)
	{		
		writeVector<PVRTSign>(file, indexset.signs);
		writeSecurityCheckpoint(file);
	}

	if (bitmask & PVRT_INDEXSET_CONTAINS_TEXTS)
	{		
		writeVector<PVRTText>(file, indexset.texts);
		writeSecurityCheckpoint(file);
	}
}

bool readIndexSet(std::istream &file, PVRTIndexSet &indexset)
{
	unsigned int bitmask = calculateIndexSetBitMask(indexset);
	file.read((char*)&bitmask, sizeof(bitmask));
	if (!checkSecurityCheckpoint(file)) return false;

	if (bitmask & PVRT_INDEXSET_CONTAINS_LINESTRIPS)
	{
		readLinestripVector(file, indexset.linestrips);		
		if (!checkSecurityCheckpoint(file)) return false;
	}

	if (bitmask & PVRT_INDEXSET_CONTAINS_POLYGONS)
	{
		readPolygonVector(file, indexset.polygons);
		if (!checkSecurityCheckpoint(file)) return false;
	}

	if (bitmask & PVRT_INDEXSET_CONTAINS_MULTIPOLYGONS)
	{
		readMultiPolygonVector(file, indexset.multipolygons);
		if (!checkSecurityCheckpoint(file)) return false;
	}

	if (bitmask & PVRT_INDEXSET_CONTAINS_TRIANGLES)
	{
		readVector<PVRTTriangle>(file, indexset.triangles);
		if (!checkSecurityCheckpoint(file)) return false;
	}

	if (bitmask & PVRT_INDEXSET_CONTAINS_POINTS)
	{		
		readVector<index_t>(file, indexset.points);
		if (!checkSecurityCheckpoint(file)) return false;
	}	

	if (bitmask & PVRT_INDEXSET_CONTAINS_PIVOTQUADS)
	{
		readVector<PVRTTriangle>(file, indexset.pivotquadtriangles);
		if (!checkSecurityCheckpoint(file)) return false;
	}

	if (bitmask & PVRT_INDEXSET_CONTAINS_SIGNS)
	{
		readVector<PVRTSign>(file, indexset.signs);
		if (!checkSecurityCheckpoint(file)) return false;
	}

	if (bitmask & PVRT_INDEXSET_CONTAINS_TEXTS)
	{
		readVector<PVRTText>(file, indexset.texts);
		if (!checkSecurityCheckpoint(file)) return false;
	}

	return true;
}

/*************************************
    RenderIndexSet File layout
	{
	CHECKPOINT
	TriangleVector     triangles;	
	CHECKPOINT
	};
*************************************/
bool writeRenderIndexSet(std::ofstream &file, const PVRTRenderIndexSet &indexset)
{		
	if ((indexset.triangles.size() > 0) && (indexset.pivotquadtriangles.size() > 0))
	{
		return false;
	}
	else if (indexset.triangles.size() > 0)
	{
		// Convert the indices from uint32 to uint16
		const size_t count = indexset.triangles.size();
		PVRTuint16 *pConvArray = new PVRTuint16[count*3];
		for (unsigned int i=0; i < count; i++)
		{
			index_t index_a = indexset.triangles[i].a;
			index_t index_b = indexset.triangles[i].b;
			index_t index_c = indexset.triangles[i].c;
			if ((index_a > USHRT_MAX) || (index_b > USHRT_MAX) || (index_c > USHRT_MAX))
			{
				return false;
			}
			pConvArray[i*3] = (PVRTuint16)index_a;
			pConvArray[i*3+1] = (PVRTuint16)index_b;
			pConvArray[i*3+2] = (PVRTuint16)index_c;
		}

		size_t size = count * 3 * sizeof(PVRTuint16);
		file.write((char*)&size, sizeof(size_t));
		file.write((char*)pConvArray, size);
		delete [] pConvArray;
		//writeRawVector<PVRTTriangle>(file, indexset.triangles);	
	}
	else if (indexset.pivotquadtriangles.size() > 0)
	{
		// Convert the indices from uint32 to uint16
		const size_t count = indexset.pivotquadtriangles.size();
		PVRTuint16 *pConvArray = new PVRTuint16[count*3];
		for (unsigned int i=0; i < count; i++)
		{
			index_t index_a = indexset.pivotquadtriangles[i].a;
			index_t index_b = indexset.pivotquadtriangles[i].b;
			index_t index_c = indexset.pivotquadtriangles[i].c;
			if ((index_a > USHRT_MAX) || (index_b > USHRT_MAX) || (index_c > USHRT_MAX))
			{
				return false;
			}
			pConvArray[i*3] = (PVRTuint16)index_a;
			pConvArray[i*3+1] = (PVRTuint16)index_b;
			pConvArray[i*3+2] = (PVRTuint16)index_c;
		}

		size_t size = count * 3 * sizeof(PVRTuint16);
		file.write((char*)&size, sizeof(size_t));
		file.write((char*)pConvArray, size);
		delete [] pConvArray;
		//writeRawVector<PVRTTriangle>(file, indexset.pivotquadtriangles);
	}
	else
	{
		// Both indexsets were empty
		return false;
	}

	return true;
}

//*************************************

bool readRenderIndexSet(std::istream &file, PVRTRenderIndexSet &indexset)
{
	size_t size = 0;
	file.read((char*)&size, sizeof(size_t));
	PVRTuint16 *dummy = new PVRTuint16[size/sizeof(PVRTuint16)];
	file.read((char*)dummy, size);
	delete [] dummy;
	
	//readRawVector<PVRTTriangle>(file, indexset.triangles);
	return true;
}


/*************************************
	BucketIndexSet File Layout
	{
	PVRTBoundingBox2D boundingbox;
	CHECKPOINT
	unsigned int  bucketindex;
	CHECKPOINT
	IndexSet      indexset;
	CHECKPOINT
	};
*************************************/
void writeBucketIndexSet(std::ofstream &file, const PVRTBucketIndexSet &indexset)
{	
	file.write((const char*)&indexset.bucketindex, sizeof(indexset.bucketindex));
	writeSecurityCheckpoint(file);
	writeBoundingBox(file, indexset.boundingbox);
	writeSecurityCheckpoint(file);
	writeRenderIndexSet(file, indexset.indexset);
	writeSecurityCheckpoint(file);
}

//*************************************

void writeBucketIndexSetVector(std::ofstream &file, const PVRTBucketIndexSetVector &indexsets)
{
	const size_t size = indexsets.size();
	file.write((const char*)&size, sizeof(size_t));
	for (unsigned int i=0; i < size; i++)
		writeBucketIndexSet(file, indexsets[i]);
}

//*************************************

bool readBucketIndexSetVector(std::istream &file, PVRTBucketIndexSetVector &indexsets)
{
	size_t size = 0;
	file.read((char*)&size, sizeof(size_t));
	indexsets.resize(size);
	for (unsigned int i=0; i < size; i++)
		if (!readBucketIndexSet(file, indexsets[i]))
			return false;
	return true;
}

//*************************************

bool readBucketIndexSet(std::istream &file, PVRTBucketIndexSet &indexset)
{
	file.read((char*)&indexset.bucketindex, sizeof(indexset.bucketindex));
	if (!checkSecurityCheckpoint(file)) return false;
	readBoundingBox(file, indexset.boundingbox);
	if (!checkSecurityCheckpoint(file)) return false;	
	if (!readRenderIndexSet(file, indexset.indexset)) return false;
	if (!checkSecurityCheckpoint(file)) return false;
	return true;
}


//*************************************

void writeBoundingBox(std::ofstream &file, const PVRTBoundingBox2D &bbox)
{
	file.write((char*)&bbox, sizeof(PVRTBoundingBox2D));
}

//*************************************

void readBoundingBox(std::istream &file, PVRTBoundingBox2D &bbox)
{
	file.read((char*)&bbox, sizeof(PVRTBoundingBox2D));
}

//*************************************

void writeLinestripVector(std::ofstream &file, const PVRTLinestripVector &linestrips)
{
	const unsigned int size = (unsigned int)linestrips.size();
	file.write((char*)&size, sizeof(unsigned int));
	
	// Write each linestrip
	for (unsigned int i=0; i < size; i++)
	{
		const PVRTLinestrip &linestrip = linestrips[i];
		file.write((const char*)&(linestrip.ref_in_id), sizeof(linestrip.ref_in_id));
		file.write((const char*)&(linestrip.nref_in_id), sizeof(linestrip.nref_in_id));
		file.write((const char*)&(linestrip.func_class), sizeof(linestrip.func_class));
		writeVector<index_t>(file, linestrip.indices);
	}
}

void readLinestripVector(std::istream &file, PVRTLinestripVector &linestrips)
{
	unsigned int size = 0;
	file.read((char*)&size, sizeof(unsigned int));
	if (size > 0)
	{
		linestrips.resize(size);

		// Read each linestrip
		for (unsigned int i=0; i < size; i++)
		{
			PVRTLinestrip &linestrip = linestrips[i];
			file.read((char*)&(linestrip.ref_in_id), sizeof(linestrip.ref_in_id));
			file.read((char*)&(linestrip.nref_in_id), sizeof(linestrip.nref_in_id));
			file.read((char*)&(linestrip.func_class), sizeof(linestrip.func_class));
			readVector<index_t>(file, linestrip.indices);
		}
	}
}

//*************************************

void writePolygonVector(std::ofstream &file, const PVRTPolygonVector &polygons)
{
	const unsigned int size = (unsigned int)polygons.size();
	file.write((char*)&size, sizeof(unsigned int));
	if (size > 0)
	{
		// Write each linestrip
		for (unsigned int i=0; i < size; i++)
		{
			const PVRTPolygon &polygon = polygons[i];
			const unsigned int n = (unsigned int)polygon.indices.size();
			file.write((char*)&n, sizeof(unsigned int));
			if (n > 0)
				file.write((char*)&(polygon.indices[0]), sizeof(index_t)*n);
		}
	}
}

void readPolygonVector(std::istream &file, PVRTPolygonVector &polygons)
{
	unsigned int size = 0;
	file.read((char*)&size, sizeof(unsigned int));
	if (size > 0)
	{
		polygons.resize(size);

		// Read each linestrip
		for (unsigned int i=0; i < size; i++)
		{
			PVRTPolygon &polygon = polygons[i];
			unsigned int n = 0;
			file.read((char*)&n, sizeof(unsigned int));			
			if (n > 0)
			{
				polygon.indices.resize(n);
				file.read((char*)&(polygon.indices[0]), sizeof(index_t)*n);
			}
		}
	}
}

//*************************************

void writeMultiPolygonVector(std::ofstream &file, const PVRTMultiPolygonVector &polygons)
{
	const unsigned int size = (unsigned int)polygons.size();
	file.write((char*)&size, sizeof(unsigned int));
	if (size > 0)
	{
		// Write each polygon vector
		for (unsigned int i=0; i < size; i++)
		{
			const PVRTPolygonVector &polygonvector = polygons[i].polygons;
			writePolygonVector(file, polygonvector);
		}
	}
}

void readMultiPolygonVector(std::istream &file, PVRTMultiPolygonVector &polygons)
{
	unsigned int size = 0;
	file.read((char*)&size, sizeof(unsigned int));
	if (size > 0)
	{
		polygons.resize(size);

		// Read each linestrip
		for (unsigned int i=0; i < size; i++)
		{
			PVRTPolygonVector &polygon = polygons[i].polygons;
			readPolygonVector(file, polygon);
		}
	}
}


//*************************************

struct PVRTVertex2
{
	PVRTVec2 position;	
	float u, v;
};

bool writeCoordinateBucket(std::ofstream &file, const PVRTCoordinateBucket &bucket)
{	
	writeBoundingBox(file, bucket.boundingbox);
	writeSecurityCheckpoint(file);
	
	if ((bucket.coordinates.size() > 0) && (bucket.pivotquads.size() > 0))
	{
		// Only one should contain data
		return false;
	}
	else if (bucket.coordinates.size() > 0)
	{
		// TODO test 2d coordinates
		vector<PVRTVertex2> coords2d;
		coords2d.resize(bucket.coordinates.size());

		for (unsigned int i=0; i < bucket.coordinates.size(); i++)
		{
			coords2d[i].position.x = bucket.coordinates[i].position.x;
			coords2d[i].position.y = bucket.coordinates[i].position.y;
			
			//coords2d[i].u = (PVRTint16)(bucket.coordinates[i].texcoord.x * 32768.0f);
			//coords2d[i].v = (PVRTint16)(bucket.coordinates[i].texcoord.y * 32768.0f);
			coords2d[i].u = bucket.coordinates[i].texcoord.x;
			coords2d[i].v = bucket.coordinates[i].texcoord.y;
		}

		//writeRawVector<PVRTVertex>(file, bucket.coordinates);
		writeRawVector<PVRTVertex2>(file, coords2d);
		writeSecurityCheckpoint(file);
	}
	else if (bucket.pivotquads.size() > 0)
	{
		writeRawVector<PVRTPivotQuadVertex>(file, bucket.pivotquads);
		writeSecurityCheckpoint(file);
	}
	else
	{
		// at least one should contain data
		return false;
	}

	return true;
}

//*************************************

bool readCoordinateBucket(std::istream &file, PVRTCoordinateBucket &bucket)
{
	readBoundingBox(file, bucket.boundingbox);
	if (!checkSecurityCheckpoint(file)) return false;
	// Note: at this point it is not possible to derive the type of coordinate 
	// stored, so consume it as simple vertex data.
	readRawVector<PVRTVertex>(file, bucket.coordinates);	
	if (!checkSecurityCheckpoint(file)) return false;
	return true;
}
  
//*************************************

bool writeCoordinateBucketVector(std::ofstream &file, const PVRTCoordinateBucketVector &buckets)
{
	const size_t size = buckets.size();
	file.write((char*)&size, sizeof(size_t));
	for (unsigned int i=0; i < size; i++)
		if (!writeCoordinateBucket(file, buckets[i]))
			return false;
	return true;
}

//*************************************

bool readCoordinateBucketVector(std::istream &file, PVRTCoordinateBucketVector &buckets)
{
	size_t size = 0;
	file.read((char*)&size, sizeof(size_t));
	buckets.resize(size);
	for (unsigned int i=0; i < size; i++)
		if (!readCoordinateBucket(file, buckets[i]))
			return false;
	return true;
}
  
//*************************************

template<typename T>
void writeVector(std::ofstream &file, const std::vector<T> &data)
{
	const size_t size = data.size();
	file.write((char*)&size, sizeof(size_t));

	if (size > 0)
	{
		file.write((char*)&(data[0]), sizeof(T)*size);
	}
}

template<typename T>
void readVector(std::istream &file, std::vector<T> &data)
{
	size_t size = 0;
	file.read((char*)&size, sizeof(size_t));
	if (size > 0)
	{
		data.resize(size);
		file.read((char*)&(data[0]), sizeof(T)*size);
	}
}

template<typename T>
void writeRawVector(std::ofstream &file, const std::vector<T> &data)
{
	const size_t size = data.size() * sizeof(T);
	file.write((char*)&size, sizeof(size_t));

	if (size > 0)
	{
		file.write((char*)&(data[0]), size);
	}
}

template<typename T>
void readRawVector(std::istream &file, std::vector<T> &data)
{
	size_t size = 0;
	file.read((char*)&size, sizeof(size_t));
	if (size > 0)
	{
		size_t numElems = size / sizeof(T);
		data.resize(numElems);
		file.read((char*)&(data[0]), size);
	}
}

//*************************************

bool checkDirectory(const char *pszDirectory)
{
	// Do nothing if the directory
	struct stat st;
	if (stat(pszDirectory, &st) == 0)	
		return true;
	else
		return false;
}

bool createDirectory(const char *pszDirectory)
{
#ifdef _WIN32
	if (_mkdir(pszDirectory) == 0)
		return true;
#else
	if (mkdir(pszDirectory, S_IRWXU | S_IRWXG | S_IRWXO) == 0)
		return true;
#endif
	return false;
}

};


/******************************************************************************
 End of file (PVRTMapFileIO.cpp)
******************************************************************************/

