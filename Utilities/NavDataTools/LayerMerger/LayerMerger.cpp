/******************************************************************************

 @File         LayerMerger.cpp

 @Title        Layer Merger

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Merges a given set of layers into a single layer. Useful to avoid
               too much fragmentation among several layers. NOTE: Currently only
               supports billboards!

******************************************************************************/

#ifdef _WIN32
#include <windows.h>
#endif

#include <iostream>
#include <vector>
using namespace std;

#include "PVRNavigation.h"
using namespace pvrnavigation;

/****************************************************************************
 ** Function declarations
 ****************************************************************************/
void merge_signs(const vector<PVRTMapLayer> &layers, PVRTMapLayer &mergedsigns);

/*!****************************************************************************
 @Function		main
 *****************************************************************************/
int main(int argc, char **argv)
{
	string indexFile;
	string inputDirectory;
	
	if (argc < 3)
	{
		cout << "Usage: " << argv[0] << " outputfile input0 [input1] [input2] [...]" << endl;
		return EXIT_FAILURE;
	}

	PVRTMapLayer mergedlayers;
	vector<PVRTMapLayer> layers;
	
	const int numLayers = argc - 2;

	// Load all layers	
	for (int i=0; i < numLayers; i++)
	{	
		string filename = argv[i+2];
		cout << endl << "Layer [ " << i-1 << " / " << argc-1 << " ] -> " << filename << endl;	
						
		PVRTMapLayer layer;
		if (!readMapLayer(filename.c_str(), layer))
		{
			cout << "Failed to read layer " << filename << endl;
			continue;
		}

		layers.push_back(layer);						
	}	

	if (layers.empty())
	{
		cerr << "Error, no layers to merge!" << endl;
		return EXIT_FAILURE;
	}

	// Merge all data fields
	merge_signs(layers, mergedlayers);
	

	cout << "Writing merged layers to " << argv[1] << " ... ";
	if (!writeMapLayer(argv[1], mergedlayers))
	{
		cerr << "failed!" << endl;
		return EXIT_FAILURE;
	}
	
	cout << "done." << endl;
	
	return EXIT_SUCCESS;
}



/*!****************************************************************************
 @Function		merge_signs
 @Input			layers         Vector of map layers to merge.
 @Output		mergedsigns    All map layers merged into a single one.
 @Description	Merges the signs stored in all map layers and stores them into
                a single one.
******************************************************************************/
void merge_signs(const vector<PVRTMapLayer> &layers, PVRTMapLayer &mergedsigns)
{
	mergedsigns.boundingbox = layers.front().boundingbox;

	for (unsigned int i=0; i < layers.size(); i++)
	{
		const PVRTMapLayer &layer = layers[i];
		
		// Merge the bounding box
		mergedsigns.boundingbox.Merge(layer.boundingbox);

		// Pre-allocate space
		mergedsigns.indexset.signs.reserve(layer.indexset.signs.size() + mergedsigns.indexset.signs.size());

		// And simply push back the existing signs
		const PVRTSignVector &signs = layer.indexset.signs;
		for (unsigned int j=0; j < signs.size(); j++)
			mergedsigns.indexset.signs.push_back(signs[j]);
	}
}

