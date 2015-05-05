/******************************************************************************

 @File         IntermediateFormatConverter.cpp

 @Title        IntermediateFormatConverter

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Intermediate format data transformation utility.

******************************************************************************/

#include <stdio.h>
#include <fstream>
#include <iostream>
using namespace std;

#include "PVRNavigation.h"
using namespace pvrnavigation;

#include "config.h"
#include "common.h"
#include "ogr_converter.h"
#include "osm_converter.h"

/*!****************************************************************************
 @Function		main
  ******************************************************************************/
int main(int argc, char **argv)
{	
	if (argc != 3)	
	{
		cout << "Usage: " << argv[0] << " [datadirectory outputdirectory]" << endl;
		return EXIT_FAILURE;
	}

	char *pDatasetDirectory = argv[1];
	char *pOutputDirectory = argv[2];
		
	cout << "Input directory:  " << pDatasetDirectory << endl;
	cout << "Output directory: " << pOutputDirectory << endl << endl;	

	// Remove the layers which should not be processed from this list
	MapFilter filters;	
	filters["MajHwys"] = EXTRACT_ALL_DATA;
	filters["SecHwys"] = EXTRACT_ALL_DATA;
	filters["WaterSeg"] = EXTRACT_ALL_DATA;
	filters["WaterPoly"] = EXTRACT_ALL_DATA;
	filters["Streets"] = EXTRACT_ALL_DATA;
	filters["RailRds"] = EXTRACT_ALL_DATA;
	filters["ParkRec"] = EXTRACT_ALL_DATA;
	filters["Landmark"] = EXTRACT_ALL_DATA;
	filters["LandUseA"] = EXTRACT_ALL_DATA;
	filters["LandUseB"] = EXTRACT_ALL_DATA;
	filters["Hospital"] = EXTRACT_ALL_DATA;
	filters["Zlevels"] = EXTRACT_ALL_DATA;	
	filters["TransHubs"] = EXTRACT_ALL_DATA;
	filters["TravDest"] = EXTRACT_ALL_DATA;
	filters["Shopping"] = EXTRACT_ALL_DATA;
	filters["Restrnts"] = EXTRACT_ALL_DATA;
	filters["Entertn"] = EXTRACT_ALL_DATA;
	filters["AutoSvc"] = EXTRACT_ALL_DATA;
	filters["Parking"] = EXTRACT_ALL_DATA;
	filters["FinInsts"] = EXTRACT_ALL_DATA;
	filters["MajHwyShield"] = EXTRACT_ALL_DATA;
	filters["SecHwyShield"] = EXTRACT_ALL_DATA;

	filters["buildings"] = EXTRACT_ALL_DATA;
	filters["natural"] = EXTRACT_ALL_DATA;
	filters["places"] = EXTRACT_ALL_DATA;
	filters["PoiAssoc"] = EXTRACT_ALL_DATA;
	filters["waterways"] = EXTRACT_ALL_DATA;

	cout << " - Converting dataset in directory " << pDatasetDirectory << endl;
	cout << " -> Output directory: " << pOutputDirectory << endl;
		
	string dir = string(pOutputDirectory) + string("/");

	// Convert the data with the OGR content loader
	std::vector<MapDescription> layers;
#ifdef ENABLE_OGR_SUPPORT
	if (!OGR_process_data(pDatasetDirectory, filters, layers))
#endif
#ifdef ENABLE_OSM_SUPPORT
	if (!OSM_process_data(pDatasetDirectory, layers))
#endif
	{
		cerr << "Failed to convert data with OGR converter." << endl;
		return EXIT_FAILURE;
	}
	
	// Output the converted binary data 
	string outdir = string(pOutputDirectory) + string("/");
	for (unsigned int i=0; i < layers.size(); i++)
	{
		cout << "Writing MapLayer " << layers[i].name << " ... ";
		string filename = outdir + layers[i].name + string("_mapLayer.txt");
		if (!writeMapLayer(filename.c_str(), layers[i].maplayer))
		{
			cerr << "failed!" << endl;
			return EXIT_FAILURE;
		}
		cout << "done." << endl;
	}

	cout << endl << "Conversion finished." << endl;
		
	return EXIT_SUCCESS;
}

