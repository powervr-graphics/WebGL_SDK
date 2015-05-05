/******************************************************************************

 @File         linestrip_converter.cpp

 @Title        NavDataCompiler

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Functionality to triangulate linestrips.

******************************************************************************/

#include "PVRNavigation.h"
using namespace pvrnavigation;

#include "debug_functions.h"

#include <vector>
#include <map>
#include <set>
#include <iostream>
#include <fstream>
#include <algorithm>
#include <sstream>
using namespace std;

#include <float.h>

#ifndef TWO_PI
#define TWO_PI   (6.283185307179586f)
#endif

//***************************************************************************
//*  Globals
//***************************************************************************

PVRTVec3 global_offset;
vector<PVRTVec3> debuglines;

PVRTVec3 debugcolours[] = { PVRTVec3(1.0f, 0.0f, 0.0f), PVRTVec3(0.0f, 1.0f, 0.0f), 
                            PVRTVec3(0.0f, 0.0f, 1.0f), PVRTVec3(1.0f, 1.0f, 0.0f),
							PVRTVec3(1.0f, 0.0f, 1.0f), PVRTVec3(0.0f, 1.0f, 1.0f),
							PVRTVec3(0.0f, 0.0f, 0.0f), PVRTVec3(1.0f, 1.0f, 1.0f) };

//***************************************************************************
//*  Structures
//***************************************************************************
typedef map<int, vector<unsigned int> > IntersectionMap;

/*!**************************************************************************
 *	@Struct Intersection
 *	@Brief  An intersection is uniquely described by it's id which in turn
            identifies the ends (ref_in_id/nref_in_id) at which the stored 
			linestrips meet.
 ****************************************************************************/
struct Intersection
{
	int id;	
	vector<unsigned int> linestrips;

	PVRTCoordinateVector cap_coordinates;
	PVRTTriangleVector cap_triangles;
};

/*!**************************************************************************
 *	@Struct PVRTLinestripExt
 *	@Brief  This structure is the extended version of a linestrip structure.
            It contains the logical linestrip description (indices etc.) and
			holds the triangulated linestrip which can be used for intersection
			calculation.
 ****************************************************************************/
struct PVRTLinestripExt
{
	PVRTLinestrip linestrip;

	PVRTCoordinateVector coordinates;
	PVRTTriangleVector triangles;	
	
	map<unsigned int, unsigned int> mapping;
};

/*!**************************************************************************
 *	@Struct PVRTCapVertexPair
 *	@Brief  This structure stores references to the vertices which define the
 *          end of a triangulated linestrip. Furthermore it stores the index
 *          of the original linestrip, the direction of the linestrip and a
 *          relative angle used to establish a relative order among linestrips
 *          at intersections.
 ****************************************************************************/
struct PVRTCapVertexPair
{
	PVRTVertex *v0, *v1;
	PVRTVec3 dir;
	float angle;
	unsigned int linestrip;
};

static bool compareAngles(const PVRTCapVertexPair &a, const PVRTCapVertexPair &b)
{
	return (a.angle < b.angle);
}

void debug_draw_intersections(const PVRTCoordinateVector &coordinates, const PVRTLinestripVector &linestrips, const vector<Intersection> &intersections, const PVRTVec3 colour, const int restriction, vector<PVRTVec3> &lines)
{
	for (unsigned int i=0; i < intersections.size(); i++)
	{
		const Intersection &intersection = intersections[i];
		if ((restriction == -1) || (intersections[i].linestrips.size() == restriction))
		{
			const PVRTLinestrip &a = linestrips[intersection.linestrips.front()];			
			if (a.ref_in_id == intersection.id)
				debug_generate_circle(colour, coordinates[a.indices.front()].position, 0.0001f, 8, lines);
			else
				debug_generate_circle(colour, coordinates[a.indices.back()].position, 0.0001f, 8, lines);
		}
	}
}


//***************************************************************************
//*  Function declarations
//***************************************************************************
void triangulate_line_2d(const PVRTVec3 &a, const PVRTVec3 &b, const float width, const PVRTMat3 &texmatrix, PVRTVertex tess_coords[4]);
void triangulate_linestrip(const PVRTCoordinateVector &coordinates, const PVRTLinestrip &linestrip, const float width, const PVRTMat3 &texmatrix, PVRTCoordinateVector &tess_coords, PVRTTriangleVector &result);
void triangulate_intersection(const PVRTCoordinateVector &coordinates, Intersection &intersection, vector<PVRTLinestripExt> &linestrips);
void triangulate_cap(const vector<PVRTLinestripExt> &linestrips, const Intersection &intersection, const float width, const PVRTMat3 &texmatrix, PVRTCoordinateVector &tess_coords, PVRTTriangleVector &triangles);
void extract_intersections(const PVRTLinestripVector &linestrips, vector<Intersection> &intersections, set<unsigned int> &intersection_set, set<unsigned int> &cap_set);
void merge_dual_intersections(const PVRTLinestripVector &linestrips, const vector<Intersection> &intersections, PVRTLinestripVector &merged_linestrips);
void remove_duplicate_linestrips(const PVRTLinestripVector &linestrips, const vector<Intersection> &intersections, PVRTLinestripVector &merged_linestrips);

/*!*************************************************************************************************
 @Function		convert_linestrips
 @Input			coordinates          The coordinate vector.
 @Input		    linestrips           Indices spanning the linestrips and pointing into the coordinate vector.
 @Input			width                The width of the triangulated linestrip.
 @Input			texmatrix            The texture transformation matrix used to calculate uv coordinates.
 @Output		output_coordinates   Calculated coordinates from the triangulation.
 @Output		triangles            Triangle indices from the triangulation.
 @Description	Triangulates a linestrip based on the specified parameters.
***************************************************************************************************/
void convert_linestrips(const PVRTCoordinateVector &coordinates, const PVRTLinestripVector &linestrips, const float width, const PVRTMat3 &texmatrix, const bool tri_caps, const bool tri_intersections, PVRTCoordinateVector &output_coordinates, PVRTTriangleVector &triangles)
{	
	set<unsigned int> cap_set, intersection_set;
	vector<Intersection> intersections;
	vector<PVRTLinestripExt> linestripexts;
	PVRTLinestripVector reduced_linestrips;

	// Extract all intersection information available			
	cerr << "Preparing triangulation data structures ... ";
	extract_intersections(linestrips, intersections, intersection_set, cap_set);
	
	// Remove duplicate linestrips to make the conversion easier
	remove_duplicate_linestrips(linestrips, intersections, reduced_linestrips);

  // Remove all linestrips which are shorter than the road width.
  // Merge the connected intersections into one and update all connected linestrips 
	PVRTLinestripVector::iterator iter = reduced_linestrips.begin();	
	while (iter != reduced_linestrips.end())
	{		
		PVRTLinestrip &linestrip = *iter;
		if (CalculateLinestripLength(coordinates, linestrip) < width)
		{
			PVRTCoordinateVector &mod_coordinates = (PVRTCoordinateVector &)coordinates;
			PVRTVec3 p0 = coordinates[linestrip.indices.front()].position;
			PVRTVec3 p1 = coordinates[linestrip.indices.back()].position;
			PVRTVec3 pmid = (p0 + p1) * 0.5f;		

			const unsigned int replacer = linestrip.ref_in_id;
			const unsigned int to_replace = linestrip.nref_in_id;

			iter = reduced_linestrips.erase(iter);
		
			for (unsigned int i=0; i < reduced_linestrips.size(); i++)
			{
				if (reduced_linestrips[i].nref_in_id == replacer || reduced_linestrips[i].ref_in_id == replacer)
					debug_generate_linestrip(PVRTVec3(0.0f, 0.0f, 1.0f), coordinates, reduced_linestrips[i], debuglines);
				if (reduced_linestrips[i].nref_in_id == to_replace)
				{
					reduced_linestrips[i].nref_in_id = replacer;
					debug_generate_linestrip(PVRTVec3(0.0f, 1.0f, 0.0f), coordinates, reduced_linestrips[i], debuglines);
				}
				if (reduced_linestrips[i].ref_in_id == to_replace)
				{
					reduced_linestrips[i].ref_in_id = replacer;
					debug_generate_linestrip(PVRTVec3(0.0f, 1.0f, 0.0f), coordinates, reduced_linestrips[i], debuglines);
				}
			}
		}
		else
			iter++;
	}
		
	// Re-run the intersection extraction as the linestrip set has changed
	intersections.clear(); intersection_set.clear(); cap_set.clear();
	extract_intersections(reduced_linestrips, intersections, intersection_set, cap_set);	
	cerr << "done." << endl;
	
	// Triangulate each linestrip and store it temporarily
	cerr << "Triangulating " << reduced_linestrips.size() << " linestrips ... ";	
	linestripexts.reserve(reduced_linestrips.size());
	for (unsigned int i=0; i < reduced_linestrips.size(); i++)
	{		
		PVRTLinestripExt linestripext;
		linestripext.linestrip = reduced_linestrips[i];
		triangulate_linestrip(coordinates, linestripext.linestrip, width, texmatrix, linestripext.coordinates, linestripext.triangles);		
		linestripexts.push_back(linestripext);
	}	
	cerr << "done." << endl;	
		
	// Triangulate intersections	
	if (tri_intersections)
	{		
		cerr << "Triangulating " << intersection_set.size() << " intersections ... ";				
		for (set<unsigned int>::iterator iter = intersection_set.begin(); iter != intersection_set.end(); iter++)
			triangulate_intersection(coordinates, intersections[*iter], linestripexts);			
		cerr << "done." << endl;				
	}

	// Triangulate caps		
	if (tri_caps)
	{		
		cerr << "Capping " << cap_set.size() << " linestrips ... ";				
		for (set<unsigned int>::iterator iter = cap_set.begin(); iter != cap_set.end(); iter++)
			triangulate_cap(linestripexts, intersections[*iter], width, texmatrix, output_coordinates, triangles);
		cerr << "done." << endl;
	}
	
	
	if (!debuglines.empty())
	{		
		const size_t numelems = debuglines.size();
		
		ofstream debugfile("debuglines.txt", ios::binary);
		if (debugfile.is_open())
		{
			debugfile.write((const char *)&numelems, sizeof(size_t));
			debugfile.write((const char *)&debuglines[0], sizeof(PVRTVec3) * numelems);
			debugfile.close();
		}
		else
			cerr << "Could not write debug data to debuglines.txt" << endl;
	}

	cerr << "Merging data ... pre-allocating ...";		

	// Convert from local linestrip coordinates to batched coordinates
	// Pre-allocate data to speed-up conversion
	unsigned int trianglecount = 0;
	unsigned int vertexcount = 0;				
	for (unsigned int i=0; i < linestripexts.size(); i++)
	{
		const PVRTLinestripExt &linestrip = linestripexts[i];
		trianglecount += linestrip.triangles.size();
		vertexcount += linestrip.coordinates.size();
	}
	// now reserve the memory in our arrays
	triangles.reserve(triangles.size() + trianglecount);
	output_coordinates.reserve(output_coordinates.size() + vertexcount);	

	cerr << "linestrips ... ";

	// Iterate through all linestrips and map the triangles in the global array
	for (unsigned int i=0; i < linestripexts.size(); i++)
	{
		PVRTLinestripExt &linestrip = linestripexts[i];		
				
		for (unsigned int j=0; j < linestrip.triangles.size(); j++)
		{			
			const PVRTTriangle &tri = linestrip.triangles[j];

			if (linestrip.mapping.find(tri.a) == linestrip.mapping.end())
			{
				linestrip.mapping[tri.a] = output_coordinates.size();
				output_coordinates.push_back(linestrip.coordinates[tri.a]);				
			}

			if (linestrip.mapping.find(tri.b) == linestrip.mapping.end())
			{
				linestrip.mapping[tri.b] = output_coordinates.size();
				output_coordinates.push_back(linestrip.coordinates[tri.b]);				
			}

			if (linestrip.mapping.find(tri.c) == linestrip.mapping.end())
			{
				linestrip.mapping[tri.c] = output_coordinates.size();
				output_coordinates.push_back(linestrip.coordinates[tri.c]);
			}

			PVRTTriangle triangle = { linestrip.mapping[tri.a], linestrip.mapping[tri.b], linestrip.mapping[tri.c] };					
			triangles.push_back(triangle);
		}
	}

	for (unsigned int i=0; i < intersections.size(); i++)
	{
		const Intersection &intersection = intersections[i];		

		for (unsigned int j=0; j < intersection.cap_triangles.size(); j++)
		{			
			const PVRTTriangle &tri = intersection.cap_triangles[j];
			const unsigned int index = output_coordinates.size();
			output_coordinates.push_back(intersection.cap_coordinates[tri.a]);				
			output_coordinates.push_back(intersection.cap_coordinates[tri.b]);				
			output_coordinates.push_back(intersection.cap_coordinates[tri.c]);

			PVRTTriangle triangle = { index, index + 1, index + 2 };					
			triangles.push_back(triangle);
		}
	}

	cerr << "done." << endl;
}


/*!********************************************************************************************
 @Function		triangulate_line_2d
 @Input			a             Start point of the line.
 @Input		    b             End point of the line. 
 @Input			texmatrix     The texture transformation matrix used to calculate uv coordinates.
 @Output		tess_coords   The width of the triangulated linestrip.
 @Description	Triangulates a 2d line segment.
***********************************************************************************************/
void triangulate_line_2d(const PVRTVec3 &a, const PVRTVec3 &b, const float width, const PVRTMat3 &texmatrix, PVRTVertex tess_coords[4])
{
	PVRTVec3 perp_dir(-(b.y - a.y), (b.x - a.x), 0.0f);
	perp_dir.normalize();
	
	tess_coords[0].position = a - perp_dir * width;
	tess_coords[0].texcoord = texmatrix * PVRTVec3(0.0f, 0.0f, 1.0f);
	tess_coords[1].position = a + perp_dir * width;	
	tess_coords[1].texcoord = texmatrix * PVRTVec3(1.0f, 0.0f, 1.0f);

	tess_coords[2].position = b - perp_dir * width;
	tess_coords[2].texcoord = texmatrix * PVRTVec3(0.0f, 0.0f, 1.0f);
	tess_coords[3].position = b + perp_dir * width;
	tess_coords[3].texcoord = texmatrix * PVRTVec3(1.0f, 0.0f, 1.0f);
}


/*!********************************************************************************************
 @Function		triangulate_linestrip
 @Input			coordinates    Coordinate vector.
 @Input		    linestrip      Linestrip to triangulate.
 @Input			width          The desired width of the triangulated linestrip.
 @Input			texmatrix      The texture transformation matrix used to calculate uv coordinates.
 @Input			addCaps        If true caps will be added to the linestrips.
 @Output		tess_coords    The coordinates which are generated during triangulation.
 @Output		result         The resulting triangle indices.
 @Description	Triangulates a linestrip.
***********************************************************************************************/
void triangulate_linestrip(const PVRTCoordinateVector &coordinates, const PVRTLinestrip &linestrip, const float width, const PVRTMat3 &texmatrix, PVRTCoordinateVector &tess_coords, PVRTTriangleVector &triangles)
{
	// This is the base index in the output coordinates vector
	const unsigned int base_index = (unsigned int)tess_coords.size();
	const unsigned int linestrip_index_count = linestrip.indices.size(); 

	tess_coords.reserve(linestrip_index_count * 2);

	// Triangulate the first segment to remove the if-condition from the for-loop
	PVRTVertex tmp_coords[4];	
	triangulate_line_2d(coordinates[linestrip.indices[0]].position, coordinates[linestrip.indices[1]].position, width, texmatrix, tmp_coords);
		
	tess_coords.push_back(tmp_coords[0]);
	tess_coords.push_back(tmp_coords[1]);
	tess_coords.push_back(tmp_coords[2]);
	tess_coords.push_back(tmp_coords[3]);
	
	PVRTTriangle t0 = { base_index, base_index + 1, base_index + 3 };
	PVRTTriangle t1 = { base_index, base_index + 3, base_index + 2 };
	triangles.push_back(t0);
	triangles.push_back(t1);

	// Iterate over the remaining segments
	for (unsigned int i=1; i < linestrip_index_count-1; i++)
	{
		// Calculate the index which points to the second last added vertex, which will be the first
		// one for the next segment
		const unsigned int index = base_index + i * 2;

		// Convenience references
		const PVRTVec3 &a = coordinates[linestrip.indices[i]].position;
		const PVRTVec3 &b = coordinates[linestrip.indices[i+1]].position;

		// Triangulate the segment
		triangulate_line_2d(a, b, width, texmatrix, tmp_coords);		
		
		// Interpolate the two last vertices of the previous segment and the two first ones of
		// the current segment to avoid gaps
		PVRTVec3 interpol_pos_a = (tess_coords[index].position + tmp_coords[0].position) * 0.5f;		
		PVRTVec3 interpol_pos_b = (tess_coords[index+1].position + tmp_coords[1].position) * 0.5f;
		
		// Now correct the angle-dependant narrowing; this is useful if the streets get to narrow
		// when the angle between two segments is too small.
		// Calculate the cosine between the original cap-vector and the interpolated ones and
		// use the inverse of this angle as scale factor for correction.
		PVRTVec3 a_dir = (interpol_pos_a - a).normalized();
		PVRTVec3 b_dir = (interpol_pos_b - a).normalized();
		PVRTVec3 org_dir = (tess_coords[index].position - a).normalized();
		float cos_angle = a_dir.dot(org_dir);
		float corr_scale = 1.0f / cos_angle;
		interpol_pos_a = a + a_dir * width * corr_scale;
		interpol_pos_b = a + b_dir * width * corr_scale;

		// Store the interpolated positions	
		tess_coords[index].position = interpol_pos_a;		
		tess_coords[index+1].position = interpol_pos_b;
						
		tess_coords.push_back(tmp_coords[2]);
		tess_coords.push_back(tmp_coords[3]);		

		PVRTTriangle ta = { index, index + 1, index + 3 };
		PVRTTriangle tb = { index, index + 3, index + 2 };
		
		triangles.push_back(ta);
		triangles.push_back(tb);
	}
}


/*!********************************************************************************************
 @Function		calculate_line_intersection_2d
 @Input			p1          Start position of the first line.
 @Input		    p2          End position of the first line.
 @Input			p3          Start position of the second line.
 @Input			p4          End position of the first line.
 @Output		intersection   The intersection point of both lines. Only valid if they intersect.
 @Return		True if both lines intersect, false otherwise.
 @Description	Calculates the intersection of two lines.
***********************************************************************************************/
bool calculate_line_intersection_2d(const PVRTVec3 &p1, const PVRTVec3 &p2, const PVRTVec3 &p3, const PVRTVec3 &p4, float &u, float &v)
{	
	float denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
		
	// Lines are parallel, do not intersect	
	if (fabs(denom) < 0.000000001f)
		return false;
	else 
		denom = 1.0f / denom;

	u = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) * denom;
	v = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) * denom;

	return true;
}

/*!********************************************************************************************
 @Function		calculate_line_intersection_2d
 @Input			a_pos          Start position of the first line.
 @Input		    a_dir          Direction vector of the first line.
 @Input			b_pos          Start position of the second line.
 @Input			b_dir          Direction of the second line.
 @Output		intersection   The intersection point of both lines. Only valid if they intersect.
 @Return		True if both lines intersect, false otherwise.
 @Description	Calculates the intersection of two lines.
***********************************************************************************************/
bool calculate_line_intersection_2d(const PVRTVec3 &a_pos, const PVRTVec3 &a_dir, const PVRTVec3 &b_pos, const PVRTVec3 &b_dir, PVRTVec3 &intersection)
{
	const PVRTVec3 p2 = a_pos + a_dir;
	const PVRTVec3 p4 = b_pos + b_dir;

	float u, v;
	if (!calculate_line_intersection_2d(a_pos, p2, b_pos, p4, u, v))
		return false;

	intersection = a_pos + (p2 - a_pos) * u;

	return true;
}


/*!********************************************************************************************
 @Function		calculate_line_intersection_2d
 @Input			p1          Start position of the first line.
 @Input		    p2          End position of the first line.
 @Input			p3          Start position of the second line.
 @Input			p4          End position of the first line.
 @Output		intersection   The intersection point of both lines. Only valid if they intersect.
 @Return		True if both lines intersect, false otherwise.
 @Description	Calculates the intersection of two lines.
***********************************************************************************************/
bool calculate_segment_intersection_2d(const PVRTVec3 &p1, const PVRTVec3 &p2, const PVRTVec3 &p3, const PVRTVec3 &p4, PVRTVec3 &intersection)
{	
	float u, v;
	if (!calculate_line_intersection_2d(p1, p2, p3, p4, u, v))
		return false;
	
	if ((u >= 0.0f && u <= 1.0f) &&
		(v >= 0.0f && v <= 1.0f))
		intersection = p1 + (p2 - p1) * u;
	else
		return false;

	return true;
}


/*!********************************************************************************************
 @Function		intersect_linestrips
 @Input			coords_a          Coordinates for the linestrip a.
 @Input		    linestrip_a       Linestrip indices for linestrip a.
 @Input			coords_b          Coordinates for the linestrip b.
 @Input			linestrip_b       Linestrip indices for linestrip b.
 @Output		intersection      The intersection point of both lines.
 @Output		seg_a             The line segment index of the first line which is intersected.
 @Output		seg_a             The line segment index of the second line which is intersected.
 @Return		True if both lines intersect, false otherwise.
 @Description	Calculates the intersection of two linestrips and returns the intersected segments.
***********************************************************************************************/
bool intersect_linestrips(const vector<PVRTVec3 *> &coords_a, const vector<PVRTVec3 *> &coords_b, PVRTVec3 &intersection, unsigned int &seg_a, unsigned int &seg_b)
{
	for (unsigned int i=0; i < coords_a.size()-1; i++)
	{
		const PVRTVec3 *a0 = coords_a[i];
		const PVRTVec3 *a1 = coords_a[i+1];
		for (unsigned int j=0; j < coords_b.size()-1; j++)
		{
			const PVRTVec3 *b0 = coords_b[j];
			const PVRTVec3 *b1 = coords_b[j+1];
			if (calculate_segment_intersection_2d(*a0, *a1, *b0, *b1, intersection))
			{
				seg_a = i;
				seg_b = j;
				return true;
			}
		}
	}

	return false;
}


/*!********************************************************************************************
 @Function		intersect_linestrips
 @Input			linestrip_a         First linestrip.
 @Input		    linestrip_b         Second linestrip.
 @Input			intersection_id     Intersectiond ID.
 @Return		True if both lines intersect, false otherwise.
 @Description	Calculates the intersection of two linestrips and adjusts the positions of the
                linestrips' vertices according to the intersection point.
***********************************************************************************************/
bool intersect_linestrips(PVRTLinestripExt &linestrip_a, PVRTLinestripExt &linestrip_b, unsigned int intersection_id)
{
	vector<PVRTVec3 *> coords_a, coords_b;
	coords_a.reserve(linestrip_a.coordinates.size()/2);
	coords_b.reserve(linestrip_b.coordinates.size()/2);

	// Extract the geometry shaping the outer lines which shall be intersected from
	// the triangulated linestrips.

	if (linestrip_a.linestrip.ref_in_id == intersection_id)
	{
		for (unsigned int i=1; i < linestrip_a.coordinates.size(); i+=2)
			coords_a.push_back(&linestrip_a.coordinates[i].position);
	}
	else
	{
		for (int i=linestrip_a.coordinates.size()-2; i >= 0; i-=2)
			coords_a.push_back(&linestrip_a.coordinates[i].position);
	}

	if (linestrip_b.linestrip.ref_in_id == intersection_id)
	{
		for (unsigned int i=0; i < linestrip_b.coordinates.size(); i+=2)
			coords_b.push_back(&linestrip_b.coordinates[i].position);
	}
	else
	{
		for (int i=linestrip_b.coordinates.size()-1; i >= 0; i-=2)
			coords_b.push_back(&linestrip_b.coordinates[i].position);
	}

	// Intersect the extracted linestrips and adjust all segments below the
	// intersection point
	PVRTVec3 intersection;
	unsigned int seg_a_idx, seg_b_idx;
	if (intersect_linestrips(coords_a, coords_b, intersection, seg_a_idx, seg_b_idx))
	{
		for (unsigned int a=0; a <= seg_a_idx; a++)
			*coords_a[a] = intersection;		
		for (unsigned int b=0; b <= seg_b_idx; b++)
			*coords_b[b] = intersection;
		return true;
	}
	else
		return false;
}


/*!********************************************************************************************
 @Function		stitch_triangulated_linestrip
 @Input			coordinates         Global coordinate vector.
 @Input		    intersection        Intersection to triangulate.
 @InOut			linestrips          Global vector of linestrips.
 @Output		tess_coords         Coordinate vector to store generated triangles.
 @Output		triangles           Index vector to store indices of generated triangles.
 @Description	Triangulates street intersections by modifying and generating triangles.
***********************************************************************************************/
void stitch_triangulated_linestrip(PVRTLinestripExt &linestrip_a, PVRTLinestripExt &linestrip_b, int intersection_id)
{
	PVRTVec3 *pva0, *pva1, *pvb0, *pvb1;

	if (linestrip_a.linestrip.ref_in_id == intersection_id)
	{
		pva0 = &linestrip_a.coordinates[0].position;
		pva1 = &linestrip_a.coordinates[1].position;
	}
	else
	{
		const unsigned int count = linestrip_a.coordinates.size();
		pva0 = &linestrip_a.coordinates[count-2].position;
		pva1 = &linestrip_a.coordinates[count-1].position;
	}

	if (linestrip_b.linestrip.ref_in_id == intersection_id)
	{
		pvb0 = &linestrip_b.coordinates[0].position;
		pvb1 = &linestrip_b.coordinates[1].position;
	}
	else
	{
		const unsigned int count = linestrip_b.coordinates.size();
		pvb0 = &linestrip_b.coordinates[count-2].position;
		pvb1 = &linestrip_b.coordinates[count-1].position;
	}
	
	PVRTVec3 mid0 = (*pva0 + *pvb0) * 0.5f;
	PVRTVec3 mid1 = (*pva1 + *pvb1) * 0.5f;
	*pva0 = *pvb0 = mid0;
	*pva1 = *pvb1 = mid1;
}

/*!********************************************************************************************
 @Function		triangulate_intersection
 @Input			coordinates         Global coordinate vector.
 @Input		    intersection        Intersection to triangulate.
 @InOut			linestrips          Global vector of linestrips.
 @Output		tess_coords         Coordinate vector to store generated triangles.
 @Output		triangles           Index vector to store indices of generated triangles.
 @Description	Triangulates street intersections by modifying and generating triangles.
***********************************************************************************************/
void triangulate_intersection(const PVRTCoordinateVector &coordinates, Intersection &intersection, vector<PVRTLinestripExt> &linestrips)
{
	const unsigned int num_intersecting = intersection.linestrips.size();

	// Do not triangulate dead-ends
	if (num_intersecting < 2)
		return;	

	// Two streets joining, simple case
	if (num_intersecting == 2 && false)
	{
		stitch_triangulated_linestrip(linestrips[intersection.linestrips.front()], linestrips[intersection.linestrips.back()], intersection.id);
		return;
	}
	
	// Pre-allocate space for the caps
	vector<PVRTCapVertexPair> cap_pairs;	
	cap_pairs.reserve(num_intersecting);

	PVRTVertex midpoint;
	midpoint.position = PVRTVec3(0.0f, 0.0f, 0.0f);
	midpoint.texcoord = PVRTVec2(0.25f, 0.5f);
	
	// Triangulate all linestrips and get the vertices nearest to the intersection
	for (unsigned int i=0; i < num_intersecting; i++)
	{		
		PVRTLinestripExt &linestrip = linestrips[intersection.linestrips[i]];
		PVRTCapVertexPair cap_pair;
		cap_pair.linestrip = intersection.linestrips[i];

		if (intersection.id == linestrip.linestrip.ref_in_id)
		{
			cap_pair.v0 = &linestrip.coordinates[0];
			cap_pair.v1 = &linestrip.coordinates[1];			
			cap_pair.dir = coordinates[linestrip.linestrip.indices[1]].position - coordinates[linestrip.linestrip.indices[0]].position;
			if (cap_pair.dir.lenSqr() > 0.0f)
				cap_pair.dir.normalize();			
			midpoint.position += coordinates[linestrip.linestrip.indices.front()].position;
		}
		else
		{
			const unsigned int count = linestrip.coordinates.size();
			cap_pair.v1 = &linestrip.coordinates[count-2];
			cap_pair.v0 = &linestrip.coordinates[count-1];
			const unsigned int linecount = linestrip.linestrip.indices.size();
			cap_pair.dir = coordinates[linestrip.linestrip.indices[linecount-2]].position - coordinates[linestrip.linestrip.indices[linecount-1]].position;			
			if (cap_pair.dir.lenSqr() > 0.0f)
				cap_pair.dir.normalize();
			midpoint.position += coordinates[linestrip.linestrip.indices.back()].position;
		}		

		cap_pairs.push_back(cap_pair);
	}

	midpoint.position /= (float)num_intersecting;

	// Pick the first linestrip as reference and calculate the angle between this and all the others
	cap_pairs.front().angle = TWO_PI;
	float ref_axis_atan2 = atan2(cap_pairs.front().dir.y, cap_pairs.front().dir.x); 
	for (unsigned int i=1; i < cap_pairs.size(); i++)
		cap_pairs[i].angle = atan2(cap_pairs[i].dir.y, cap_pairs[i].dir.x) - ref_axis_atan2 + TWO_PI;		

	// Now sort according to the angle
	sort(cap_pairs.begin(), cap_pairs.end(), compareAngles);	

	// Start with the last cap pair, wrap around and iterate through
	// Compare neighboring caps and calculate the intersections of their outer lines
	vector<PVRTCapVertexPair> hole_fillers;
	vector<unsigned int> identical_caps;
	for (unsigned int i=cap_pairs.size()-1, j=0; j < cap_pairs.size(); i=j++)
	{
		bool patch_hole = true;
		PVRTCapVertexPair &left_cap = cap_pairs[i];
		PVRTCapVertexPair &right_cap = cap_pairs[j];

		// There is no general need to patch holes in a two-way intersection
		if (num_intersecting == 2)
			patch_hole = false;

		// Calculate the angles between the two roads and make sure that it's between 0 and 360 degress
		float angle = right_cap.angle - left_cap.angle;
		float angle_degree = (angle / TWO_PI) * 360.0f;		
		if (angle_degree < 0.0f)
			angle_degree += 360.0f;

		// If two streets meet without any difference in angle AND there are more than 2 streets intersecting handle it
		if (angle == 0.0f && (num_intersecting > 2))
		{
			identical_caps.push_back(i);
			continue;
		}		
		else if (angle_degree > 175.0f)
		{			
			PVRTVec3 intersection_point;
			bool intersect = calculate_line_intersection_2d(left_cap.v1->position, left_cap.dir, right_cap.v0->position, right_cap.dir, intersection_point);			
			if (intersect)
			{
				left_cap.v1->position = intersection_point;
				right_cap.v0->position = intersection_point;										
			}
			// else: add code to handle this case
		}
		// Try to calculate the intersection between both roads
		else
		{			
			PVRTLinestripExt &linestrip_left = linestrips[left_cap.linestrip];
			PVRTLinestripExt &linestrip_right = linestrips[right_cap.linestrip];			
			if (!intersect_linestrips(linestrip_left, linestrip_right, intersection.id))
			{				
				// add code to handle the case that there is no intersection found between both triangulated linestrips				
				patch_hole = true;
			}
		}

		if (patch_hole)
			hole_fillers.push_back(left_cap);							
	}

	// Patch the identical caps; assign the position of the first caps first vertex to 
	// the position of the second caps first vertex and vice versa. This is possible
	// as these are the resulting positions of intersection with respective neighbours.
	for (unsigned int i=0; i < identical_caps.size(); i++)
	{
		unsigned int left_cap_index = identical_caps[i];		
		unsigned int right_cap_index = ((left_cap_index == cap_pairs.size() - 1) ?  0 : (left_cap_index + 1));
						
		PVRTCapVertexPair &left_cap = cap_pairs[left_cap_index];
		PVRTCapVertexPair &right_cap = cap_pairs[right_cap_index];		

		left_cap.v1->position = right_cap.v1->position;
		right_cap.v0->position = left_cap.v0->position;
	}
		
	midpoint.position = PVRTVec3(0.0f);
	midpoint.texcoord = PVRTVec2(0.25f, 0.0f);
	for (unsigned int i=0; i < hole_fillers.size(); i++)
	{
		PVRTCapVertexPair &cap = hole_fillers[i];
		midpoint.position += cap.v0->position;
		midpoint.position += cap.v1->position;
	}
	midpoint.position /= (float)(hole_fillers.size() * 2);	

	// Now fill the holes in the intersections
	//
	// Calculate the midpoint of all caps and push it at the end of the list
	const unsigned int midpoint_index = intersection.cap_coordinates.size();
	intersection.cap_coordinates.push_back(midpoint);

	for (unsigned int i=0; i < hole_fillers.size(); i++)
	{
		PVRTCapVertexPair &cap = hole_fillers[i];
		PVRTLinestripExt &linestrip = linestrips[cap.linestrip];
		
		const unsigned int index = intersection.cap_coordinates.size();

		intersection.cap_coordinates.push_back(*cap.v0);
		intersection.cap_coordinates.push_back(*cap.v1);
		PVRTTriangle tri = { midpoint_index, index, index + 1 };
		intersection.cap_triangles.push_back(tri);
	}
}

/*!********************************************************************************************
 @Function		triangulate_caps
 @Input			coordinates    Coordinate vector.
 @Input		    linestrip      Linestrip to add caps to.
 @Input			width          The desired width of the triangulated linestrip. 
 @Input         texmatrix      Texture coordinate transformation matrix.
 @Input         caps           Set containing all intersection ids which are to be capped.
 @Output		tess_coords    The coordinates which are generated during triangulation.
 @Output		triangles      The resulting triangle indices.
 @Description	Triangulates an intersection.
***********************************************************************************************/
void triangulate_cap(const vector<PVRTLinestripExt> &linestrips, const Intersection &intersection, const float width, const PVRTMat3 &texmatrix, PVRTCoordinateVector &tess_coords, PVRTTriangleVector &triangles)
{
	const float cap_length = width;

	if (intersection.linestrips.size() > 1)
	{
		cerr << "Error, more than one linestrip at a dead-end!" << endl;
		return;
	}

	const PVRTLinestripExt &linestrip = linestrips[intersection.linestrips.front()];

	PVRTVec3 cap_pos0, cap_pos1, cap_dir;
		
	// Check whether the linestrip has to start with a cap	
	if (linestrip.linestrip.ref_in_id == intersection.id)
	{							
		cap_pos0 = linestrip.coordinates[0].position;
		cap_pos1 = linestrip.coordinates[1].position;
		// Calculate the direction vector in which to extrude the cap
		cap_dir = linestrip.coordinates[0].position - linestrip.coordinates[2].position;
		if (cap_dir.lenSqr() > 0.0f)
				cap_dir.normalize();
	}
	else if (linestrip.linestrip.nref_in_id == intersection.id)
	{				
		const unsigned int linestrip_size = linestrip.coordinates.size();

		cap_pos0 = linestrip.coordinates[linestrip_size-2].position;
		cap_pos1 = linestrip.coordinates[linestrip_size-1].position;

		// Calculate the direction vector in which to extrude the cap
		cap_dir = linestrip.coordinates[linestrip_size-1].position - linestrip.coordinates[linestrip_size-3].position;
		if (cap_dir.lenSqr() > 0.0f)
				cap_dir.normalize();			
	}
	else
	{
		cerr << "Error, intersection id does not match neither ends!" << endl;
		return;
	}

	PVRTVertex cap0 = { (cap_pos0 + cap_dir * cap_length), texmatrix * PVRTVec3(0.0f, 1.0f, 1.0f) };
	PVRTVertex cap1 = { (cap_pos1 + cap_dir * cap_length), texmatrix * PVRTVec3(1.0f, 1.0f, 1.0f) };
	PVRTVertex cap2 = { cap_pos0, texmatrix * PVRTVec3(0.0f, 0.0f, 1.0f) };
	PVRTVertex cap3 = { cap_pos1, texmatrix * PVRTVec3(1.0f, 0.0f, 1.0f) };				

	const unsigned int start_index = (unsigned int)tess_coords.size();	
	tess_coords.push_back(cap0);
	tess_coords.push_back(cap1);
	tess_coords.push_back(cap2);
	tess_coords.push_back(cap3);

	PVRTTriangle cap_t0 = { start_index + 1, start_index, start_index + 3 };
	PVRTTriangle cap_t1 = { start_index + 3, start_index, start_index + 2 };
	triangles.push_back(cap_t0);
	triangles.push_back(cap_t1);	
}

/*!*************************************************************************************************
 @Function		extract_intersections
 @Input			linestrips          The vector of linestrips. 
 @Output		intersections       The vector containing all intersections.
 @Description	Builds a map of all intersections.
***************************************************************************************************/
void extract_intersections(const PVRTLinestripVector &linestrips, vector<Intersection> &intersections, set<unsigned int> &intersection_set, set<unsigned int> &cap_set)
{
	// Intersections will be temporarily stored here
	IntersectionMap intersections_map;
	// Iterate over all linestrips and add the intersection id to the map
	for (unsigned int i=0; i < linestrips.size(); i++)
	{
		const PVRTLinestrip &linestrip = linestrips[i];
		intersections_map[linestrip.ref_in_id].push_back(i);
		intersections_map[linestrip.nref_in_id].push_back(i);
	}

	// Remove the intersections with id == -1
	IntersectionMap::iterator illegal_id = intersections_map.find(-1);
	if (illegal_id != intersections_map.end())
	{
		//cerr << "Illegal intersection found!" << endl;
		intersections_map.erase(illegal_id);
	}
	
	// Pre-allocate space
	intersections.reserve(intersections.size() + intersections_map.size());
	// Transform map into vector for optimized access	
	for (IntersectionMap::iterator iter = intersections_map.begin(); iter != intersections_map.end(); iter++)
	{
		Intersection intersection;
		intersection.id = iter->first;
		intersection.linestrips = iter->second;
		intersections.push_back(intersection);	

		if (intersection.linestrips.size() == 1)
			cap_set.insert(intersections.size()-1);			
		else
			intersection_set.insert(intersections.size()-1);
	}
}

/*!*************************************************************************************************
 @Function		remove_duplicate_linestrips
 @Input			linestrips          The vector of linestrips. 
 @Output		intersections       The vector containing all intersections.
 @Description	Builds a map of all intersections.
***************************************************************************************************/
void remove_duplicate_linestrips(const PVRTLinestripVector &linestrips, const vector<Intersection> &intersections, PVRTLinestripVector &merged_linestrips)
{
	unsigned int duplicates = 0;
	map<unsigned int, unsigned int> index_mapping;
	
	const unsigned int num_lines = linestrips.size();
	for (unsigned int i=0; i < num_lines; i++)
		index_mapping[i] = i;

	for (unsigned int i=0; i < intersections.size(); i++)
	{
		const Intersection &intersection = intersections[i];
		if (intersections[i].linestrips.size() == 2)
		{			
			const PVRTLinestrip &a = linestrips[index_mapping[intersection.linestrips.front()]];
			const PVRTLinestrip &b = linestrips[index_mapping[intersection.linestrips.back()]];

			// Duplicates, remove them
			if ((a.ref_in_id == b.ref_in_id && a.nref_in_id == b.nref_in_id) ||
				(a.ref_in_id == b.nref_in_id && a.nref_in_id == b.ref_in_id))
			{
				duplicates++;
				index_mapping[intersection.linestrips.front()] = index_mapping[intersection.linestrips.back()];
				continue;
			}			
		}		
	}

	set<unsigned int> valid_linestrips;
	map<unsigned int, unsigned int>::const_iterator map_iter = index_mapping.begin();
	for (; map_iter != index_mapping.end(); map_iter++)
		valid_linestrips.insert(map_iter->second);

	merged_linestrips.reserve(valid_linestrips.size());
	set<unsigned int>::const_iterator set_iter = valid_linestrips.begin();
	for (; set_iter != valid_linestrips.end(); set_iter++)
		merged_linestrips.push_back(linestrips[*set_iter]);
	cout << "removed " << duplicates << " duplicates ... ";
}

