/******************************************************************************

 @File         navdatacompiler.cpp

 @Title        NavDataCompiler

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Providing functionality to convert data from the intermediate
               representation into the compiled format used for rendering.

******************************************************************************/

#include <iostream>
#include <string>
#include <vector>
#include <set>
#include <algorithm>
#include <iterator>
#include <fstream>
using namespace std;

#include "PVRNavigation.h"
#include "PVRTriangulate.h"
using namespace pvrnavigation;

#include "common.h"
#include "indexfile_parser.h"

/*!********************************************************************************************
 @Function		main
***********************************************************************************************/
int main(int argc, char **argv)
{
	string indexFile;

	if (argc == 2)
	{
		indexFile = argv[1];
	}
	else if (argc != 2)
	{
		cout << "Usage: " << argv[0] << " indexfile" << endl;
		return EXIT_FAILURE;
	}
	
	string inputDirectory;
	string outputDirectory;	

	cout << "Using Index file -> " << indexFile << endl;	

	vector<MapFileDescription> filedescriptions;
	if (!parse_indexfile(indexFile.c_str(), filedescriptions))
	{
		cout << "Error reading index file." << endl;
		return EXIT_FAILURE;
	}

	// Check if the directories exist
	if (!checkDirectory(filedescriptions[0].input_path.c_str()))
	{
		cout << "Error, please check the input directory: " << filedescriptions[0].input_path << endl;		
		return EXIT_FAILURE;
	}

	if (!checkDirectory(filedescriptions[0].output_path.c_str()))
	{
		// if it does not exist, try to create it
		if (!createDirectory(filedescriptions[0].output_path.c_str()))
		{
			cout << "Error, failed to create output directory -> " << filedescriptions[0].output_path << endl;
			return EXIT_FAILURE;
		}
	}
	
	// Process all layers found in indexfile	
	for (unsigned int i=0; i < filedescriptions.size(); i++)
	{	
		const MapFileDescription &filedescription = filedescriptions[i];

		cout << endl << "Layer [ " << i+1 << " / " << filedescriptions.size() << " ] -> " << filedescription.identifier << endl;	
		
		// Read the layer from file
		string src_filename = filedescription.input_path + "/" + filedescription.input_filename;
		PVRTMapLayer layer;
		if (!readMapLayer(src_filename.c_str(), layer))
		{
			cout << "Error, failed to read layer " << src_filename << ", skipping to next layer." << endl;
			continue;
		}		

		// Initialize the target layer
		PVRTBucketMapLayer bucketlayer;
		bucketlayer.boundingbox = layer.boundingbox;
					
		switch (filedescription.layeroperation)
		{
		//
		// Extracts all polygons found in maplayer and triangulates them
		//
		case EXTRACT_POLYGONS:
			{
				PVRTCoordinateVector triangle_coords;
				PVRTTriangleVector triangle_indices;

				if (!layer.indexset.multipolygons.empty())
				{
					cout << "Triangulating " << layer.indexset.multipolygons.size() << " multipolygons ... ";
					for (unsigned int j=0; j < layer.indexset.multipolygons.size(); j++)
						TriangulatePolygon(layer.coordinates, layer.indexset.multipolygons[j], triangle_coords, triangle_indices);
					cout << "done." << endl;
				}
				else if (!layer.indexset.polygons.empty())
				{
					cout << "Triangulating " << layer.indexset.polygons.size() << " polygons ... ";
					for (unsigned int j=0; j < layer.indexset.polygons.size(); j++)
						TriangulatePolygon(layer.coordinates, layer.indexset.polygons[j], triangle_coords, triangle_indices);
					cout << "done." << endl;
				}

				layer.coordinates = triangle_coords;
				layer.indexset.triangles = triangle_indices;
			}
			break;

		//
		// Extracts all line primitives in maplayer and triangulates them to roads
		//
		case EXTRACT_ROADS:
			{				
				if (!layer.indexset.linestrips.empty())
				{
					const float width = filedescription.road_attributes.width;
					const PVRTMat3 &texmatrix = filedescription.road_attributes.texture_matrix;
					const bool caps = filedescription.road_attributes.triangulate_caps;
					const bool intersections = filedescription.road_attributes.triangulate_intersections;
					const set<int> &func_classes = filedescription.road_attributes.func_classes;

					cout << "Extracting linestrips according to func_class ... ";					
					PVRTLinestripVector linestrips;
					for (unsigned int i=0; i < layer.indexset.linestrips.size(); i++)
					{
						if (func_classes.find(layer.indexset.linestrips[i].func_class) != func_classes.end())
							linestrips.push_back(layer.indexset.linestrips[i]);
					}
					cout << "done." << endl;

					PVRTCoordinateVector coordinates;
					PVRTTriangleVector triangles;
					convert_linestrips(layer.coordinates, linestrips, width, texmatrix, caps, intersections, coordinates, triangles);
					layer.coordinates = coordinates;
					layer.indexset.triangles = triangles;
				}
			}
			break;

		case EXTRACT_TEXT_BILLBOARDS:
			{
				if (!layer.indexset.texts.empty())
				{
					PVRTTextureAtlas atlas;
					string atlas_filename = filedescription.input_path + "/" + filedescription.texture_attributes.texture_atlas;

					if (!atlas.LoadAtlasDefinitionFromFile(atlas_filename.c_str()))
					{
						cout << "Error: Failed to load texture atlas definition: " << atlas_filename << endl;
					}
					else
					{				
						cout << "Converting " << layer.indexset.texts.size() << " billboard texts ... ";										
						convert_texts(layer, atlas, layer.pivotquads, layer.indexset.pivotquadtriangles);
						// No need for the text data anymore
						layer.indexset.texts.clear();
						cout << "done." << endl;
					}
				}
			}
			break;

		case EXTRACT_TEXT_TRIANGLES:
			{
				if (!layer.indexset.texts.empty())
				{
					PVRTTextureAtlas atlas;
					string atlas_filename = filedescription.input_path + "/" + filedescription.text_attributes.texture_atlas;

					if (!atlas.LoadAtlasDefinitionFromFile(atlas_filename.c_str()))
					{
						cout << "Error: Failed to load texture atlas definition: " << atlas_filename << endl;
					}
					else
					{				
						cout << "Converting " << layer.indexset.texts.size() << " texts ... ";		
						PVRTCoordinateVector triangle_coordinates;
						convert_text_to_triangles(layer, atlas, filedescription.text_attributes.scale, triangle_coordinates, layer.indexset.triangles);
						layer.coordinates = triangle_coordinates;
						// No need for the text data anymore
						layer.indexset.texts.clear();
						cout << "done." << endl;
					}
				}
			}
			break;

		case EXTRACT_SIGNS:
			{
				if (!layer.indexset.signs.empty())
				{
					PVRTTextureAtlas atlas;
					string atlas_filename = filedescription.input_path + "/" + filedescription.texture_attributes.texture_atlas;

					if (!atlas.LoadAtlasDefinitionFromFile(atlas_filename.c_str()))
					{
						cout << "Error: Failed to load texture atlas definition: " << atlas_filename << endl;
					}
					else
					{
						cout << "Converting " << layer.indexset.signs.size() << " signs ...";
						convert_signs(layer, atlas, layer.pivotquads, layer.indexset.pivotquadtriangles);
						// No need for the sign data anymore
						layer.indexset.signs.clear();
						cout << "done." << endl;
					}
				}

				break;
			}


		default:
			cout << "Error, unknown operation for layer " << filedescription.identifier << endl;
			return EXIT_FAILURE;
		}

		/* At this point all data has been transformed into a format suitable for rendering.
		 * The next steps will split the data into geological regions (buckets) for spatial
		 * culling.
		 */
			
        //
		// Create buckets for spatial indexing
		//
		PVRTCoordinateBucketVector coordbuckets;
		PVRTBucketIndexSetVector indexsets;

		cout << "Spatially subdividing data: (min nr. of primitives/bucket -> " << filedescription.min_primitive_count << ")" << endl;
		cout << "  Geometry:   " << filedescription.map_subdiv_recursions << " recursions." << endl;
        cout << "  Index data: " << filedescription.bucket_subdiv_recursions << " recursions." << endl;
		if (!create_buckets(layer, filedescription.map_subdiv_recursions, filedescription.bucket_subdiv_recursions, filedescription.min_primitive_count, bucketlayer))
		{
			cout << "Error, createBuckets() failed, skipping to next layer." << endl;
			continue;
		}

		// Count bucket contents
		unsigned int primitiveCount = 0;
		for (unsigned int j=0; j < bucketlayer.bucketindexsets.size(); j++)
			primitiveCount += bucketlayer.bucketindexsets[j].indexset.PrimitiveCount();		
		cout << "Layer contains " << primitiveCount << " primitives." << endl;

		//
		// Adjust all coordinates to be relative to the bounding box min corner
		//
		for (unsigned int k=0; k < bucketlayer.coordinatebuckets.size(); k++)
		{
			PVRTCoordinateBucket &bucket = bucketlayer.coordinatebuckets[k];
			PVRTVec2 offset = bucket.boundingbox.minCoords;
		
			for (unsigned int j=0; j < bucket.coordinates.size(); j++)
			{
				bucket.coordinates[j].position.x -= offset.x;
				bucket.coordinates[j].position.y -= offset.y;
			}

			for (unsigned int j=0; j < bucket.pivotquads.size(); j++)
			{
				bucket.pivotquads[j].origin -= offset;				
			}
		}
		
		string dst_filename = filedescription.output_path + "/" + filedescription.output_filename;
		if (!writeBucketMapLayer(dst_filename.c_str(), bucketlayer))
		{
			cout << "Failed to write " << dst_filename << endl;
			continue;
		}

/*
#ifdef _DEBUG 
		PVRTBucketMapLayer layerCheck;
		if (!readBucketMapLayer(dst_filename.c_str(), layerCheck))
		{
			cout << "Failed to read " << dst_filename << endl;
			continue;
		}
		else
		{				
			if ((layerCheck.boundingbox.minCoords != bucketlayer.boundingbox.minCoords) ||
				(layerCheck.boundingbox.maxCoords != bucketlayer.boundingbox.maxCoords) ||
				(layerCheck.bucketindexsets.size() != bucketlayer.bucketindexsets.size()) ||
				(layerCheck.coordinatebuckets.size() != bucketlayer.coordinatebuckets.size()))
			{
				cout << "Error: Failed to re-parse data during sanity-check." << endl;
			}				
		}
#endif
		*/
	}

	cout << endl << "Conversion finished." << endl;
	
	return 0;
}

