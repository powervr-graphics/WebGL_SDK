/******************************************************************************

 @File         scenecompiler.cpp

 @Title        3dSceneCompiler

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Generates a hirarchy file indexing buildings and its various
               sub-parts and calculating bounding boxes for those.

******************************************************************************/

#include <PVRTModelPOD.h>
#include <stdlib.h>

#include "PVRNavigation.h"
using namespace pvrnavigation;

#include <fstream>
#include <iostream>
#include <iterator>
#include <string>
#include <vector>
#include <limits>
#include <set>
using namespace std;

struct PVRTModelVertex
{
	PVRTVec3 position;
	PVRTVec3 normal;
	PVRTVec2 texcoord;
};

struct ModelDescription
{
	vector<PVRTBoundingBox2D> aBoundingBoxes;
	vector<string>            aszLodFilenames;
	vector<string>            aszBaseLodFilenames;
};

struct PodHirarchy
{
	PVRTBoundingBox2D    boundingbox;
	vector<unsigned int> children;
};
typedef map<unsigned int, PodHirarchy> PodHirarchyMap;

struct TileHirarchy
{
	PVRTBoundingBox2D      boundingbox;
	vector<string>         filenames;
	vector<PodHirarchyMap> hirarchies;
};


bool read_config_file(const char *pszFile, vector<ModelDescription> &descriptions);
void dump_materials(const char *pszFile, const vector<ModelDescription> &descriptions);

void calculate_bounding_box(const SPODMesh &mesh, PVRTBoundingBox2D &bbox);
void calculate_pod_hirarchy(const CPVRTModelPOD &model, PodHirarchyMap &hirarchy);

bool calculate_scene_hirarchy(const vector<ModelDescription> &descriptions, vector<TileHirarchy> &tile_hirarchies);
bool write_scene_hirarchy(const char *pszFilename, const vector<TileHirarchy> &tile_hirarchies);

/*!****************************************************************************
 @Function		main
******************************************************************************/
int main(int argc, char **argv)
{
	const char *pszInputFile = 0;
	const char *pszOutputFile = 0;
	const char *pszMaterialsFile = 0;

	if (argc == 3)
	{
		pszInputFile = argv[1];
		pszOutputFile = argv[2];
	}
	else if (argc == 4)
	{
		pszInputFile = argv[1];
		pszOutputFile = argv[2];
		pszMaterialsFile = argv[3];
	}
	else
	{
		cerr << "Usage: " << argv[0] << " config-file output-file [material_dump_file]" << endl;
		return EXIT_FAILURE;
	}

	vector<ModelDescription> descriptions;
	if (!read_config_file(pszInputFile, descriptions))
	{
		cerr << "Error: failed parsing the config file." << endl;
		return EXIT_FAILURE;
	}

	vector<TileHirarchy> tile_hirarchies;
	if (!calculate_scene_hirarchy(descriptions, tile_hirarchies))
	{
		cerr << "Error: failed to generate hirarchy." << endl;
		return EXIT_FAILURE;
	}

	if (!write_scene_hirarchy(pszOutputFile, tile_hirarchies))
	{
		cerr << "Error: failed to write hirarchy file." << endl;
		return EXIT_FAILURE;
	}

	if (pszMaterialsFile)
		dump_materials(pszMaterialsFile, descriptions);
	
	return EXIT_SUCCESS;
}

/*!****************************************************************************
 @Function		read_config_file
 @Input         pszFile
 @Input         config
 @Return		bool		true if no error occured
 @Description	Reads the scene compiler configuration file
******************************************************************************/
bool read_config_file(const char *pszFile, vector<ModelDescription> &descriptions)
{
	PVRParser parser;
	if (!parser.parse(pszFile))
		return false;

	const unsigned int numberoftiles = parser.parse_unsigned_int();

	//
	// Parse model filenames
	//	
	vector<string> directories;
	const unsigned int numDirectories = parser.parse_unsigned_int();
	for (unsigned int i=0; i < numDirectories; i++)
	{
		string directory = parser.parse_string();
		// add trailing directory slash if necessary
		if (directory[directory.size()-1] == '\\' || directory[directory.size()-1] == '/')
			directories.push_back(directory);
		else
			directories.push_back(directory + '/');
	}

	descriptions.resize(numberoftiles);
	for (unsigned int i=0; i < numberoftiles; i++)
	{
		const unsigned lodlevels = parser.parse_unsigned_int();

		for (unsigned int j=0; j < lodlevels; j++)
		{
			// store the filename with and without model directory
			string filename = parser.parse_string();			
			descriptions[i].aszLodFilenames.push_back(directories[j] + filename);
			descriptions[i].aszBaseLodFilenames.push_back(filename);
		}
	}
	
	return true;
}



/*!****************************************************************************
 @Function		calculate_scene_hirarchy
 @Input         descriptions      List of tiles and various LOD models
 @Output        tile_hirarchies   Resulting list of tile hirarchy maps
 @Return		bool		      true if no error occured
 @Description	Generates an index per tile which builds an hirarchy on top of
                the POD model file, providing child-parent relationships and
				bounding boxes.
******************************************************************************/
bool calculate_scene_hirarchy(const vector<ModelDescription> &descriptions, vector<TileHirarchy> &tile_hirarchies)
{
	const unsigned int numTiles = descriptions.size();

	// Load all files and calculate bounding boxes
	for (unsigned int i=0; i < numTiles; i++)
	{
		const ModelDescription &description = descriptions[i];

		TileHirarchy tile_hirarchy;
		bool first_object = true;			

		// For each LOD
		for (unsigned int j=0; j < description.aszLodFilenames.size(); j++)
		{
			CPVRTModelPOD model;
			if (PVR_SUCCESS != model.ReadFromFile(description.aszLodFilenames[j].c_str()))
			{
				cerr << "Failed loading file: " << description.aszLodFilenames[j] << endl;
				return false;
			}	
									
			// Find the parent-child relationships
			PodHirarchyMap hirarchy;			
			calculate_pod_hirarchy(model, hirarchy);						

			// Calculate the bounding box for each parent, which is the union of all child bounding boxes
			PodHirarchyMap::iterator iter = hirarchy.begin();
			for (; iter != hirarchy.end(); iter++)
			{
				PodHirarchy &parent = iter->second;

				for (unsigned int k=0; k < parent.children.size(); k++)
				{
					PVRTBoundingBox2D mesh_bbox;
					
					const SPODNode &node = model.pNode[parent.children[k]];
					calculate_bounding_box(model.pMesh[node.nIdx], mesh_bbox);

					if (k == 0)
						parent.boundingbox = mesh_bbox;
					else
						parent.boundingbox.Merge(mesh_bbox);
				}

				// Merge the tile bounding box with the smaller ones
				if (first_object)
				{
					first_object = false;
					tile_hirarchy.boundingbox = parent.boundingbox;
				}
				else
					tile_hirarchy.boundingbox.Merge(parent.boundingbox);
			}

			tile_hirarchy.filenames.push_back(description.aszBaseLodFilenames[j]);
			tile_hirarchy.hirarchies.push_back(hirarchy);
		}

		tile_hirarchies.push_back(tile_hirarchy);
	}

	return true;
}

/*!****************************************************************************
 @Function		write_scene_hirarchy
 @Input         pszFilename      The filename of the index file to write to.
 @Input         tile_hirarchies  List of tile hirarchies to write to the file.
 @Return		bool		     true if no error occured
 @Description	Writes the list of tile hirarchies to a single file in the
                following format:
                |Number of Tiles| (for each tile:)
				 |Tile Bounding Box|Number of LODs| (for each LOD:)
				  |LOD filename|Number of parents| (for each parent:)
				   |Bounding Box|Number of children|Children IDs|
******************************************************************************/
bool write_scene_hirarchy(const char *pszFilename, const vector<TileHirarchy> &tile_hirarchies)
{
	ofstream file(pszFilename, ios::binary);
	if (!file.is_open())
	{
		cerr << "Failed opening output file: " << pszFilename << endl;
		return false;
	}

	// Write the number of tiles
	const size_t numTiles = tile_hirarchies.size();
	file.write((const char *)&numTiles, sizeof(size_t));

	// Load all files and calculate bounding boxes
	for (unsigned int i=0; i < numTiles; i++)
	{		
		const TileHirarchy tile_hirarchy = tile_hirarchies[i];
		
		file.write((const char *)&tile_hirarchy.boundingbox, sizeof(PVRTBoundingBox2D));
		const size_t numLod = tile_hirarchy.filenames.size();
		file.write((const char *)&numLod, sizeof(size_t));

		for (unsigned int n=0; n < numLod; n++)
		{
			size_t namelength = tile_hirarchy.filenames[n].length();
			file.write((const char *)&namelength, sizeof(size_t));
			file.write(tile_hirarchy.filenames[n].c_str(), sizeof(char) * namelength);
			const size_t numObjects = tile_hirarchy.hirarchies[n].size();
			file.write((const char *)&numObjects, sizeof(size_t));

			PodHirarchyMap::const_iterator iter = tile_hirarchy.hirarchies[n].begin();
			for (; iter != tile_hirarchy.hirarchies[n].end(); iter++)
			{
				const PodHirarchy &object = iter->second;
				file.write((const char *)&object.boundingbox, sizeof(PVRTBoundingBox2D));
				size_t numSubObjects = object.children.size();
				file.write((const char *)&numSubObjects, sizeof(size_t));
				file.write((const char *)&object.children[0], sizeof(unsigned int) * numSubObjects);						
			}
		}
	}
	
	return true;
}


/*!****************************************************************************
 @Function		calculate_bounding_box
 @Input         mesh   The mesh to calculate the bounding box for.
 @Output        bbox   The resulting 2D bounding box
 @Description	Calculates the bounding box for a given model. 
                !Beware that the coordinates are swizzled (y has to be swizzled
				with z) and the final y coordinate is negated in order to line
				up with map data.
******************************************************************************/
void calculate_bounding_box(const SPODMesh &mesh, PVRTBoundingBox2D &bbox)
{
	bbox.minCoords = PVRTVec2(std::numeric_limits<float>::infinity());
	bbox.maxCoords = PVRTVec2(-std::numeric_limits<float>::infinity());
	
	const PVRTModelVertex *pData = (const PVRTModelVertex *)mesh.pInterleaved;

	// Swizzle the coordinates (z == up)
	for (unsigned int j=0; j < mesh.nNumVertex; j++)
	{
		const PVRTModelVertex &vertex = pData[j];
		bbox.minCoords.x = PVRT_MIN(vertex.position.x, bbox.minCoords.x);
		bbox.minCoords.y = PVRT_MIN(-vertex.position.z, bbox.minCoords.y);		
		bbox.maxCoords.x = PVRT_MAX(vertex.position.x, bbox.maxCoords.x);
		bbox.maxCoords.y = PVRT_MAX(-vertex.position.z, bbox.maxCoords.y);
	}
}


/*!****************************************************************************
 @Function		dump_materials
 @Input         pszFile
 @Input         config
 @Description	Helper function to extract the materials referenced in the
                configuration set (to reduce the size of materials necessary
				for the demo to run).
******************************************************************************/
void dump_materials(const char *pszFile, const vector<ModelDescription> &descriptions)
{
	set<string> refmaterials;
	size_t nrmodels = descriptions.size();
	for (unsigned int i=0; i < nrmodels; i++)
	{
		for (unsigned int j=0; j < descriptions[i].aszLodFilenames.size(); j++)
		{
			CPVRTModelPOD model;
			if (PVR_SUCCESS != model.ReadFromFile(descriptions[i].aszLodFilenames[j].c_str()))
			{
				cerr << "Failed loading file: " << descriptions[i].aszLodFilenames[j] << endl;
				return;
			}			
						
			for (unsigned int k=0; k < model.nNumTexture; k++)
				refmaterials.insert(model.pTexture[k].pszName);						
		}
	}

	// Write to a plain text file, starting with the number of materials found and then
	// enumerating all referenced materials (aka textures).
	ofstream materialfile(pszFile);
	materialfile << refmaterials.size() << endl;
	copy(refmaterials.begin(), refmaterials.end(), ostream_iterator<string>(materialfile, "\n"));
	materialfile.close();
}


/*!****************************************************************************
 @Function		createPodObjectHirarchy
 @Input         model
 @Input         config
 @Description	Creates a list of parent nodes and the children they are referencing
                within a POD file.
******************************************************************************/
void calculate_pod_hirarchy(const CPVRTModelPOD &model, PodHirarchyMap &hirarchy)
{
	// First pass: find all children
	for (unsigned int i=0; i < model.nNumMeshNode; i++)
	{
		const SPODNode &node = model.pNode[i];

		// Child node
		if (node.nIdxParent != -1)
			hirarchy[node.nIdxParent].children.push_back(node.nIdx);
	}

	// Second pass: find all nodes which are parent and leaf node at the same time
	for (unsigned int i=0; i < model.nNumMeshNode; i++)
	{
		const SPODNode &node = model.pNode[i];

		// Root node
		if (node.nIdxParent == -1)
			// which is not registered as parent
			if (hirarchy.find(node.nIdx) == hirarchy.end())
				// add it as a child node with itself as parent, reduces the amount of special cases
				hirarchy[node.nIdx].children.push_back(node.nIdx);
	}
}

