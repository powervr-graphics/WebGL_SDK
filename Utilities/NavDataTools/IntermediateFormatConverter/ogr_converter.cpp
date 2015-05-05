/******************************************************************************

 @File         ogr_converter.cpp

 @Title        IntermediateFormatConverter

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Intermediate format data transformation adaptor using the OGR
               http://www.gdal.org) library to access data.

******************************************************************************/

#include "ogr_converter.h"
#include "config.h"

#include <iostream>
#include <set>
#include <string>
using namespace std;

#ifndef ENABLE_OGR_SUPPORT

bool OGR_process_data(const char *pszDirectory, MapFilter &filter, std::vector<MapDescription> &layers)
{
	cerr << "OGR support disabled, please check config.h" << endl;
	return false;
}

#else // ENABLE_OGR_SUPPORT

#include <proj_api.h>
#include "ogrsf_frmts.h"
#include "ogr_api.h"

#include "PVRNavigation.h"
using namespace pvrnavigation;

//********************************************
//*  Function declarations
//********************************************
bool OGR_extract_geometry(OGRLayer *pLayer, pvrnavigation::PVRTMapLayer &mapLayer, const projPJ &srcProj, const projPJ &dstProj);
bool OGR_extract_highwaynames(OGRLayer *pLayer, pvrnavigation::PVRTMapLayer &mapLayer, const projPJ &srcProj, const projPJ &dstProj);
bool OGR_extract_streetnames(OGRLayer *pLayer, pvrnavigation::PVRTMapLayer &mapLayer, const float min_dist, const float min_street_length, const projPJ &srcProj, const projPJ &dstProj);
bool OGR_extract_pointsofinterest(OGRLayer *pLayer, pvrnavigation::PVRTMapLayer &mapLayer, const projPJ &srcProj, const projPJ &dstProj);

// Used to store tuples out of feature id and position of the feature
typedef multimap<int, PVRTVec2> FeatIdPosCache;

/*!*****************************************************************************************************
 @Function		transform_coordinate
 @Input			srcPrj     The source projection.
 @Input			dstPrj     The destination projection.
 @InOut			x          The x coordinate specified in the source projection coordinate system (in degrees).
 @InOut			y          The y coordinate specified in the source projection coordinate system (in degrees)
 @Return                   Transformed coordinate pair, 0 vector otherwise
 @Description	Transforms the given coordinates into another coordinate system. Please note that this function
                is tailored towards transforming coordinates in a LatLong/WGS84 coordinate system (in degrees)
				into the UTM system.
********************************************************************************************************/
PVRTVec2 transform_coordinate(const projPJ &srcProj, const projPJ &dstProj, double x, double y)
{
	double rx = x * DEG_TO_RAD;
	double ry = y * DEG_TO_RAD;				
	if (pj_transform(srcProj, dstProj, 1, 1, &rx, &ry, NULL) != 0)
		return PVRTVec2(0.0f);
	return PVRTVec2((float)rx, (float)ry);
}

int calculate_UTM_zone(double longtitude)
{
	return (int)(floor((longtitude + 180.0) / 6.0) + 1.0);
}

/*!*****************************************************************************************************
 @Function		OGR_process_data
 @Input			pszDirectory      The directory containing all the layer files.
 @Input			filter            Filter map to describe the features to extract per layer.
 @Input			layers            The extracted layer information will be stored in this vector.
 @Return                          True if successful, false otherwise.
 @Description	Extracts all data according to the set filters and stores it for later usage.
********************************************************************************************************/
bool OGR_process_data(const char *pszDirectory, MapFilter &filters, std::vector<MapDescription> &layers)
{
	OGRRegisterAll();
    
	OGRDataSource *pDataset = OGRSFDriverRegistrar::Open(pszDirectory);
    if (!pDataset)
    {    		
		cerr << "[OGR] Could not open dataset in directory: " << pszDirectory << endl;
		return false;
	}

	projPJ pj_latlong = pj_init_plus("+proj=latlong +ellps=WGS84");	
		
	// Iterate over all layers
	const int numLayers = pDataset->GetLayerCount();	

	for (int i=0; i < numLayers; i++)
	{
		cout << endl;

		OGRLayer *pLayer = pDataset->GetLayer(i);
		if (!pLayer) 
		{
			cerr << "[OGR] Error reading layer " << i << ", skipping ... " << endl;
			continue;
		}

		// Calculate the UTM zone
		OGREnvelope envelope;
		pLayer->GetExtent(&envelope);
		int utm = calculate_UTM_zone((envelope.MinX + envelope.MaxX) * 0.5);
		char utm_proj_buffer[128];
		sprintf(utm_proj_buffer, "+proj=utm +ellps=WGS84 +zone=%d", utm);
		projPJ pj_utm = pj_init_plus(utm_proj_buffer);

		projPJ pj_tmerc = pj_init_plus("+proj=tmerc +lat_0=41.8832708598511 +lon_0=-87.63984257585696 +k=1.0 +ellps=GRS80"); 
		
		// Check if we want to process this layer
		MapDescription mapdescription;
		mapdescription.name = pLayer->GetLayerDefn()->GetName();
		if (filters.find(mapdescription.name) == filters.end())
		{
			cout << "Skipping layer " << mapdescription.name << ", not found in filters." << endl;
			continue;
		}

		cout << endl << "Layer [ " << i+1 << " / " << numLayers << " ] -> " << mapdescription.name << endl;		
		int filter = filters[mapdescription.name];		
		
		if (filter & EXTRACT_GEOMETRY_DATA)
		{
			cout << " Extracting geometry ... " << endl;
			OGR_extract_geometry(pLayer, mapdescription.maplayer, pj_latlong, pj_tmerc);
			cout << "  " << mapdescription.maplayer.indexset.points.size() << " points" << endl;
			cout << "  " << mapdescription.maplayer.indexset.polygons.size() << " polygons" << endl;
			cout << "  " << mapdescription.maplayer.indexset.linestrips.size() << " linestrips" << endl;
		}
		if (filter & EXTRACT_HIGHWAYNAMES)
		{
			cout << " Extracting highways ... " << endl;
			OGR_extract_highwaynames(pLayer, mapdescription.maplayer, pj_latlong, pj_tmerc);
		}
		if (filter & EXTRACT_STREETNAMES)
		{
			cout << " Extracting streets ... " << endl;			
			OGR_extract_streetnames(pLayer, mapdescription.maplayer, 0.002f, 0.001047158f, pj_latlong, pj_tmerc);
		}
		if (filter & EXTRACT_POI)
		{
			cout << " Extracting points of interest ... " << endl;
			OGR_extract_pointsofinterest(pLayer, mapdescription.maplayer, pj_latlong, pj_tmerc);
		}

		layers.push_back(mapdescription);
		cout << " - Done." << endl;
	}

	return true;
}


/*!*****************************************************************************************************
 @Function		OGR_extract_geometry
 @Input			pLayer      The map layer as an OGR object.
 @Input			mapLayer    The mapLayer where all the extracted features will be stored.
 @Return                    True if successful, false otherwise.
 @Description	Extracts all geometry data from the OGR layer (points, polygons, lines).
********************************************************************************************************/
bool OGR_extract_geometry(OGRLayer *pLayer, pvrnavigation::PVRTMapLayer &mapLayer, const projPJ &srcProj, const projPJ &dstProj)
{
	pLayer->ResetReading();
	OGRFeatureDefn *pFeatDef = pLayer->GetLayerDefn();

	OGREnvelope envelope;
	pLayer->GetExtent(&envelope);
	mapLayer.boundingbox.minCoords = transform_coordinate(srcProj, dstProj, envelope.MinX, envelope.MinY);
	mapLayer.boundingbox.maxCoords = transform_coordinate(srcProj, dstProj, envelope.MaxX, envelope.MaxY);
	
	const int numFeatures = pLayer->GetFeatureCount();	
	mapLayer.coordinates.reserve(numFeatures);
	unsigned int skippedFeatures = 0;
	unsigned int skippedLinestripPoints = 0;
	
	for (int j=0; j < numFeatures; j++)
	{
		// Only print every fifth debug message
		if ((j%5)==0) cout << "\r\tFeature [ " << j+1 << " / " << numFeatures << " ]";

		OGRFeature *pFeature = pLayer->GetFeature(j);
		if (!pFeature) continue;			

		// Extract geometry primitive
		OGRGeometry *pGeom = pFeature->GetGeometryRef();
		if (!pGeom)
		{
			skippedFeatures++;
			continue;
		}

		switch (wkbFlatten(pGeom->getGeometryType()))
		{
		case wkbPoint:
			{
				OGRPoint *pPoint = (OGRPoint*)pGeom;
												
				PVRTVec2 ptrans = transform_coordinate(srcProj, dstProj, pPoint->getX(), pPoint->getY());				
				PVRTVertex point = { PVRTVec3(ptrans.x, ptrans.y, (float)pPoint->getZ()), PVRTVec2(0.0f, 0.0f) };
				
				// Store point
				mapLayer.coordinates.push_back(point);
				// and index
				mapLayer.indexset.points.push_back(mapLayer.coordinates.size()-1);
				break;
			}

		case wkbPolygon:
			{
				OGRPolygon *opoly = (OGRPolygon*)pGeom;

				PVRTPolygon exterior_polygon;
								
				OGRLinearRing *ring = opoly->getExteriorRing();		
				if (ring)
				{
					const unsigned int numPoints = ring->getNumPoints();
					if (numPoints > 0)
					{
						OGRRawPoint *points = new OGRRawPoint[numPoints];
						ring->getPoints(points);						

						exterior_polygon.indices.reserve(numPoints);

						for (unsigned int i=0; i < numPoints; i++)
						{									
							PVRTVec2 ptrans = transform_coordinate(srcProj, dstProj, points[i].x, points[i].y);				
							PVRTVertex point = { PVRTVec3(ptrans.x, ptrans.y, 0.0f), PVRTVec2(0.0f, 0.0f) };

							// Store point and index
							mapLayer.coordinates.push_back(point);
							exterior_polygon.indices.push_back(mapLayer.coordinates.size()-1);
						}

						mapLayer.indexset.polygons.push_back(exterior_polygon);
						delete [] points;				
					}
				}

				const int numInteriorRings = opoly->getNumInteriorRings();
				if (numInteriorRings > 0)
				{
					PVRTMultiPolygon multipolygon;
					multipolygon.polygons.reserve(numInteriorRings+1);
					multipolygon.polygons.push_back(exterior_polygon);

					for (int i=0; i < numInteriorRings; i++)
					{
						OGRLinearRing *ring = opoly->getInteriorRing(i);					
						if (ring)
						{
							const unsigned int numPoints = ring->getNumPoints();
							if (numPoints > 0)
							{
								OGRRawPoint *points = new OGRRawPoint[numPoints];
								ring->getPoints(points);

								PVRTPolygon polygon;
								polygon.indices.reserve(numPoints);

								for (unsigned int i=0; i < numPoints; i++)
								{								
									PVRTVec2 ptrans = transform_coordinate(srcProj, dstProj, points[i].x, points[i].y);
									PVRTVertex point = { PVRTVec3(ptrans.x, ptrans.y, 0.0f), PVRTVec2(0.0f, 0.0f) };

									// Store point and index
									mapLayer.coordinates.push_back(point);
									polygon.indices.push_back(mapLayer.coordinates.size()-1);
								}

								multipolygon.polygons.push_back(polygon);
								delete [] points;				
							}
						}	
					}

					// Re-enable the following if we use advanced polygon triangulator
					//mapLayer.indexset.multipolygons.push_back(multipolygon);
				}

				break;
			}

		case wkbLineString:
			{
				int ref_in_id_pos = pFeature->GetFieldIndex("REF_IN_ID");
				int nref_in_id_pos = pFeature->GetFieldIndex("NREF_IN_ID");
				int func_class_id_pos = pFeature->GetFieldIndex("FUNC_CLASS");

				OGRLineString *pLineString = (OGRLineString*)pGeom;
				int numPoints = pLineString->getNumPoints();				

				if (numPoints > 0)
				{
					PVRTLinestrip linestrip;
					if (ref_in_id_pos != -1) linestrip.ref_in_id = pFeature->GetFieldAsInteger(ref_in_id_pos);
					else linestrip.ref_in_id = -1;
					if (nref_in_id_pos != -1) linestrip.nref_in_id = pFeature->GetFieldAsInteger(nref_in_id_pos);
					else linestrip.nref_in_id = -1;
					if (func_class_id_pos != -1) linestrip.func_class = pFeature->GetFieldAsInteger(func_class_id_pos);
					else linestrip.func_class = -1;

					linestrip.indices.reserve(numPoints);

					OGRRawPoint *points = new OGRRawPoint[numPoints];
					pLineString->getPoints(points);					

					for (int i=0; i < numPoints; i++)
					{
						PVRTVec2 ptrans = transform_coordinate(srcProj, dstProj, points[i].x, points[i].y);						
						PVRTVertex point = { PVRTVec3(ptrans.x, ptrans.y, 0.0f), PVRTVec2(0.0f, 0.0f) };

						// Store point and index
						mapLayer.coordinates.push_back(point);
						linestrip.indices.push_back(mapLayer.coordinates.size()-1);
					}
					
					mapLayer.indexset.linestrips.push_back(linestrip);
					delete [] points;
				}
				
				break;
			}

		default:
			break;
		}			

		OGRFeature::DestroyFeature(pFeature);
	} // numFeatures	

	cout << "\r\tFeature [ " << numFeatures << " / " << numFeatures << " ]" << endl;
	if (skippedFeatures > 0) cout << endl << "Skipped " << skippedFeatures << " bad features." << endl;
	cout << endl << "Skipped " << skippedLinestripPoints << " points in linestrips." << endl;
	
	return true;
}


/*!*****************************************************************************************************
 @Function		OGR_extract_streetnames
 @Input			pLayer                The map layer as an OGR object.
 @Input			mapLayer              The mapLayer where all the extracted features will be stored.
 @Input			min_dist              Minimum distance of features sharing the same id, too close ones
                                      will be discarded to prevent overlaps.
 @Input			min_street_length     Minimum street segment length, will be skipped if too short.
 @Return                              True if successful, false otherwise.
 @Description	Extracts all streetnames from the OGR layer and stores their position.
********************************************************************************************************/
bool OGR_extract_streetnames(OGRLayer *pLayer, pvrnavigation::PVRTMapLayer &mapLayer, const float min_dist, const float min_street_length, const projPJ &srcProj, const projPJ &dstProj)
{
	pLayer->ResetReading();

	OGRFeatureDefn *pFeatDef = pLayer->GetLayerDefn();
	const int numFeatures = pLayer->GetFeatureCount();
	const int numFields = pFeatDef->GetFieldCount();
	const char *pFeatureName = pFeatDef->GetName();

	OGREnvelope envelope;
	pLayer->GetExtent(&envelope);
	
	mapLayer.boundingbox.minCoords = transform_coordinate(srcProj, dstProj, envelope.MinX, envelope.MinY);
	mapLayer.boundingbox.maxCoords = transform_coordinate(srcProj, dstProj, envelope.MaxX, envelope.MaxY);
	
	OGRSpatialReference *pSpatRef = pLayer->GetSpatialRef();

	FeatIdPosCache featIdPosCache;
	pair<FeatIdPosCache::iterator, FeatIdPosCache::iterator> range_iterator;
	FeatIdPosCache::iterator iterator;

	int baseNameIndex = pFeatDef->GetFieldIndex("ST_NM_BASE");
	int suffixNameIndex = pFeatDef->GetFieldIndex("ST_TYP_AFT");
	int attachedNameIndex = pFeatDef->GetFieldIndex("ST_TYP_ATT");
	int featIdIndex = pFeatDef->GetFieldIndex("FEAT_ID");
	int routeTypeIndex = pFeatDef->GetFieldIndex("ROUTE_TYPE");
			
	if (baseNameIndex == -1 || suffixNameIndex == -1 || attachedNameIndex == -1 || featIdIndex == -1)
	{
		cout << "\tCould not extract data, database missing required field." << endl;
		return false;
	}
	
	unsigned int proximity_drops = 0;
	unsigned int length_drops = 0;
	unsigned int non_street_drops = 0;
	float avg_street_length = 0.0f;
	for (int j=0; j < numFeatures; j++)
	{
		cout << "\r\tFeature [ " << j + 1 << " / " << numFeatures << "]";

		OGRFeature *pFeature = pLayer->GetFeature(j);
		if (!pFeature)
			continue;			

		// Skip all streets with a defined route type, because that means they are not regular streets
		const char *pszRouteType = pFeature->GetFieldAsString(routeTypeIndex);
		if ((pszRouteType == NULL) || strlen(pszRouteType) > 0)
		{
			non_street_drops++;
			continue;
		}

		bool add_text = true;			

		const PVRTLinestrip &linestrip = mapLayer.indexset.linestrips[j];

		float linestrip_length = CalculateLinestripLength(mapLayer.coordinates, linestrip);
		avg_street_length += linestrip_length;
		if (linestrip_length < min_street_length)
		{
			add_text = false;
			length_drops++;
		}
		else
		{
			PVRTVec3 pos_3d = InterpolateLinestrip(mapLayer.coordinates, linestrip, 0.5f);
			PVRTVec2 pos(pos_3d.x, pos_3d.y);

			// Skip duplicate street name entries if they are too close to each other
			int featId = pFeature->GetFieldAsInteger(featIdIndex);
			range_iterator = featIdPosCache.equal_range(featId);			
			for (iterator = range_iterator.first; iterator != range_iterator.second; iterator++)
			{
				// Calculate the distance to all other same-named streets
				if ((iterator->second - pos).length() < min_dist)
				{
					// if one is too near, don't add this name
					add_text = false;
					proximity_drops++;
					break;
				}
			}
			
			if (add_text)
				featIdPosCache.insert(pair<int, PVRTVec2>(featId, pos));
		}

		if (add_text)
		{
			PVRTText text;
			text.index = j;

			const char *pszBaseString = pFeature->GetFieldAsString(baseNameIndex);
			const char *pszSuffixString = pFeature->GetFieldAsString(suffixNameIndex);

			if (strlen(pszBaseString) == 0)
				continue;

			if (pFeature->GetFieldAsString(attachedNameIndex)[0] == 'N')
				snprintf(text.szName, sizeof(text.szName), "%s %s", pszBaseString, pszSuffixString);
			else
				snprintf(text.szName, sizeof(text.szName), "%s%s", pszBaseString, pszSuffixString);

			mapLayer.indexset.texts.push_back(text);
		}

		OGRFeature::DestroyFeature(pFeature);
	}
	cout << "\r\tFeature [ " << numFeatures << " / " << numFeatures << "]" << endl;
	cout << "\tExtracted " << mapLayer.indexset.texts.size() << " texts." << endl;
	cout << "\tDropped -> Proximity: " << proximity_drops << ", Length: " << length_drops << ", Non-Street: " << non_street_drops << endl;
	cout << "\tAvg street length: " << avg_street_length / (float)numFeatures << endl;

	return true;
}

/*!*****************************************************************************************************
 @Function		OGR_extract_highwaynames
 @Input			pLayer                The map layer as an OGR object.
 @Input			mapLayer              The mapLayer where all the extracted features will be stored.
 @Return                              True if successful, false otherwise.
 @Description	Extracts all highwaynames from the OGR layer and stores their position.
********************************************************************************************************/
bool OGR_extract_highwaynames(OGRLayer *pLayer, pvrnavigation::PVRTMapLayer &mapLayer, const projPJ &srcProj, const projPJ &dstProj)
{
	pLayer->ResetReading();

	OGRFeatureDefn *pFeatDef = pLayer->GetLayerDefn();
	const int numFeatures = pLayer->GetFeatureCount();
	const int numFields = pFeatDef->GetFieldCount();
	const char *pFeatureName = pFeatDef->GetName();

	OGREnvelope envelope;
	pLayer->GetExtent(&envelope);

	mapLayer.boundingbox.minCoords = transform_coordinate(srcProj, dstProj, envelope.MinX, envelope.MinY);
	mapLayer.boundingbox.maxCoords = transform_coordinate(srcProj, dstProj, envelope.MaxX, envelope.MaxY);

	OGRSpatialReference *pSpatRef = pLayer->GetSpatialRef();

	int nameIndex = -1;
	int dirIndex = -1;
	int typeIndex = -1;

	for (int fieldIndex=0; fieldIndex < numFields; fieldIndex++)
	{
		const char *pszDef = pFeatDef->GetFieldDefn(fieldIndex)->GetNameRef();
		if (strcmp(pszDef, "HIGHWAY_NM") == 0)
			nameIndex = fieldIndex;
		else if (strcmp(pszDef, "DIRONSIGN") == 0)
			dirIndex = fieldIndex;
		else if (strcmp(pszDef, "HWY_TYPE") == 0)
			typeIndex = fieldIndex;
	}

	if (nameIndex == -1 || dirIndex == -1 || typeIndex == -1)
	{
		cout << "\tCould not extract data, database missing required field." << endl;
		return false;
	}

	for (int j=0; j < numFeatures; j++)
	{
		cout << "\r\tFeature [ " << j + 1 << " / " << numFeatures << "]";
		OGRFeature *pFeature = pLayer->GetFeature(j);		
		if (!pFeature)
			continue;					
		
		OGRGeometry *pGeom = pFeature->GetGeometryRef();

		if (!pGeom)
		{
			cout << "Feature " << j << " has no geometric definition. Skipping ... " << endl;
			continue;
		}

		if (wkbFlatten(pGeom->getGeometryType()) != wkbPoint)
		{
			cout << "Feature " << j << " is not a point. Skipping ... " << endl;
			continue;
		}

		OGRPoint *pPoint = (OGRPoint*)pGeom;	
					
		PVRTVertex vertex;
		PVRTVec2 ptrans = transform_coordinate(srcProj, dstProj, pPoint->getX(), pPoint->getY());

		vertex.position = PVRTVec3(ptrans.x, ptrans.y, 0.0f);
		mapLayer.coordinates.push_back(vertex);
		PVRTLinestrip ls;
		ls.indices.push_back(mapLayer.coordinates.size() - 1);
		ls.indices.push_back(mapLayer.coordinates.size() - 1);
		mapLayer.indexset.linestrips.push_back(ls);
		PVRTText text;
		text.index = mapLayer.indexset.linestrips.size() - 1;
		strncpy(text.szName, pFeature->GetFieldAsString(nameIndex), sizeof(text.szName));				
		mapLayer.indexset.texts.push_back(text);

		PVRTSign sign;
		sign.position = ptrans;
		strncpy(sign.szName, pFeature->GetFieldAsString(typeIndex), sizeof(sign.szName));	
		mapLayer.indexset.signs.push_back(sign);

		OGRFeature::DestroyFeature(pFeature);
	}
	cout << "\r\tFeature [ " << numFeatures << " / " << numFeatures << "]" << endl;

	return true;
}


/*!*****************************************************************************************************
 @Function		OGR_extract_pointsofinterest
 @Input			pLayer                The map layer as an OGR object.
 @Input			mapLayer              The mapLayer where all the extracted features will be stored.
 @Return                              True if successful, false otherwise.
 @Description	Extracts all points of interest from the OGR layer and stores their position and name.
********************************************************************************************************/
bool OGR_extract_pointsofinterest(OGRLayer *pLayer, pvrnavigation::PVRTMapLayer &mapLayer, const projPJ &srcProj, const projPJ &dstProj)
{
	pLayer->ResetReading();

	OGRFeatureDefn *pFeatDef = pLayer->GetLayerDefn();
	const int numFeatures = pLayer->GetFeatureCount();
	const int numFields = pFeatDef->GetFieldCount();
	const char *pFeatureName = pFeatDef->GetName();

	OGREnvelope envelope;
	pLayer->GetExtent(&envelope);
	
	mapLayer.boundingbox.minCoords = transform_coordinate(srcProj, dstProj, envelope.MinX, envelope.MinY);
	mapLayer.boundingbox.maxCoords = transform_coordinate(srcProj, dstProj, envelope.MaxX, envelope.MaxY);

	OGRSpatialReference *pSpatRef = pLayer->GetSpatialRef();
	
	int facTypeIndex = -1;
	int poiIdIndex = -1;
	
	for (int fieldIndex=0; fieldIndex < numFields; fieldIndex++)
	{
		const char *pszDef = pFeatDef->GetFieldDefn(fieldIndex)->GetNameRef();
		if (strcmp(pszDef, "FAC_TYPE") == 0)
			facTypeIndex = fieldIndex;		
		if (strcmp(pszDef, "POI_NAME") == 0)
			poiIdIndex = fieldIndex;		
	}

	if (facTypeIndex == -1 || poiIdIndex == -1)
	{
		cout << "\tCould not extract data, database missing required field." << endl;
		return false;
	}

	for (int j=0; j < numFeatures; j++)
	{
		cout << "\r\tFeature [ " << j + 1 << " / " << numFeatures << "]";
		OGRFeature *pFeature = pLayer->GetFeature(j);
		if (!pFeature)
			continue;			
		
		OGRGeometry *pGeom = pFeature->GetGeometryRef();

		if (!pGeom)
		{
			cout << "Feature " << j << " has no geometric definition. Skipping ... " << endl;
			continue;
		}

		if (wkbFlatten(pGeom->getGeometryType()) != wkbPoint)
		{
			cout << "Feature " << j << " is not a point. Skipping ... " << endl;
			continue;
		}

		OGRPoint *pPoint = (OGRPoint*)pGeom;		
		
		PVRTSign sign;
		sign.position = transform_coordinate(srcProj, dstProj, pPoint->getX(), pPoint->getY());
		strncpy(sign.szName, pFeature->GetFieldAsString(facTypeIndex), sizeof(sign.szName));				
		mapLayer.indexset.signs.push_back(sign);
				
		OGRFeature::DestroyFeature(pFeature);
	}
	cout << "\r\tFeature [ " << numFeatures << " / " << numFeatures << "]" << endl;

	return true;
}

#endif // #ifdef(ENABLE_OGR_SUPPORT)

