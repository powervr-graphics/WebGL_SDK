/******************************************************************************

 @File         debug_functions.cpp

 @Title        NavDataCompiler

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Interface file for all data transformation functions.

******************************************************************************/
#include "debug_functions.h"

#include "PVRNavigation.h"
using namespace pvrnavigation;

#include <vector>
using namespace std;

#ifndef TWO_PI
#define TWO_PI   (6.283185307179586f)
#endif

/*!*************************************************************************************************
 @Function		debug_generate_linestrip
 @Input			colour          The colour of the generated linestrip.
 @Input			coordinates     Coordinates of the linestrip. 
 @Output		lines           Vector of linestrips where the generated one will be appended to.
 @Description	Creates a linestrip out of a set of specified coordinates.
***************************************************************************************************/
void debug_generate_linestrip(const PVRTVec3 colour, const vector<PVRTVec3> &coordinates, vector<PVRTVec3> &lines)
{
	for (unsigned int i=0; i < coordinates.size()-1; i++)
	{
		lines.push_back(coordinates[i]);
		lines.push_back(colour);
		lines.push_back(coordinates[i+1]);
		lines.push_back(colour);
	}
}

/*!*************************************************************************************************
 @Function		debug_generate_linestrip
 @Input			colour          The colour of the generated linestrip.
 @Input			coordinates     Coordinates of the linestrip. 
 @Input			linestrip       Indices of the linestrip.
 @Output		lines           Vector of linestrips where the generated one will be appended to.
 @Description	Creates a linestrip out of a set of specified coordinates and indices.
***************************************************************************************************/
void debug_generate_linestrip(const PVRTVec3 colour, const PVRTCoordinateVector &coordinates, const PVRTLinestrip &linestrip, vector<PVRTVec3> &lines)
{
	for (unsigned int i=0; i < linestrip.indices.size()-1; i++)
	{
		lines.push_back(coordinates[linestrip.indices[i]].position);
		lines.push_back(colour);
		lines.push_back(coordinates[linestrip.indices[i+1]].position);
		lines.push_back(colour);
	}
}

/*!*************************************************************************************************
 @Function		debug_generate_arrow
 @Input			colour          The colour of the generated linestrip.
 @Input			start           Starting point of the arrow. 
 @Input			end             End point of the arrow. The tip will be generated here.
 @Input			tipsize         Size of the arrow head.
 @Output		lines           Vector of linestrips where the generated ones will be appended to.
 @Description	Creates a vector with an arrow head at one end.
***************************************************************************************************/
void debug_generate_arrow(const PVRTVec3 colour, const PVRTVec3 start, const PVRTVec3 end, const float tipsize, vector<PVRTVec3> &lines)
{
	PVRTVec3 dir = PVRTVec3(start.x - end.x, start.y - end.y, 0.0f).normalized() * tipsize;	
	PVRTVec3 perp(dir.y, -dir.x, 0.0f);	
	lines.push_back(start);
	lines.push_back(colour);
	lines.push_back(end);
	lines.push_back(colour);
	
	lines.push_back(end);
	lines.push_back(colour);
	lines.push_back(end + dir + perp);
	lines.push_back(colour);

	lines.push_back(end);
	lines.push_back(colour);
	lines.push_back(end + dir - perp);
	lines.push_back(colour);
}

/*!*************************************************************************************************
 @Function		debug_generate_arrow
 @Input			colour          The colour of the generated linestrip.
 @Input			coordinates     Coordinates of the line geometry.
 @Input			indices         Indices describing the linestrip. The tip will be generated at the last index.
 @Input			tipsize         Size of the arrow head.
 @Output		lines           Vector of linestrips where the generated ones will be appended to.
 @Description	Creates a linestrip with an arrow head at one end.
***************************************************************************************************/
void debug_generate_arrow(const PVRTVec3 colour, const PVRTCoordinateVector &coordinates, const vector<index_t> indices, const float tipsize, vector<PVRTVec3> &lines)
{
	const unsigned int num_indices = indices.size();
	for (unsigned int i=0; i < num_indices - 2; i++)
	{
		lines.push_back(coordinates[indices[i]].position);
		lines.push_back(colour);
		lines.push_back(coordinates[indices[i+1]].position);
		lines.push_back(colour);
	}

	debug_generate_arrow(colour, coordinates[indices[num_indices-2]].position, coordinates[indices[num_indices-1]].position, tipsize, lines); 
}

/*!*************************************************************************************************
 @Function		debug_generate_circle
 @Input			colour          The colour of the generated linestrip.
 @Input			center          Center of the circle.
 @Input			radius          Radius of the circle.
 @Input			numsubdivs      Number of subdivisions of the circle.
 @Output		lines           Vector of linestrips where the generated ones will be appended to.
 @Description	Creates a circle out of a linestrip.
***************************************************************************************************/
void debug_generate_circle(const PVRTVec3 colour, const PVRTVec3 center, const float radius, const unsigned int numsubdivs, vector<PVRTVec3> &lines)
{	
	float step = TWO_PI / (float)numsubdivs;
	float angle = 0.0f;
	PVRTVec3 circle_pos(cos(angle) * radius, sin(angle) * radius, 0.0f);

	for (unsigned int i=0; i < numsubdivs; i++)
	{					
		angle += step;
		lines.push_back(center + circle_pos);
		lines.push_back(colour);		
		circle_pos.x = cos(angle) * radius;
		circle_pos.y = sin(angle) * radius;
		lines.push_back(center + circle_pos);
		lines.push_back(colour);
	}
}

/*!*************************************************************************************************
 @Function		debug_generate_number
 @Input			colour          The colour of the generated linestrip.
 @Input			pos             Starting position of the number in world coordinates.
 @Input			scale           Scale of the text.
 @Input			number          The actual number to print.
 @Output		lines           Vector of linestrips where the generated ones will be appended to.
 @Description	Creates a vectorized text out of a number.
***************************************************************************************************/
void debug_generate_number(const PVRTVec3 colour, const PVRTVec3 pos, const float scale, const unsigned int number, vector<PVRTVec3> &lines)
{	
	stringstream strstr;
	strstr << number;
	string word = strstr.str();

	PVRTVec3 local_pos = pos;
	PVRTVec3 up(0.0f, scale, 0.0f);
	PVRTVec3 right(scale, 0.0f, 0.0f);
	
	for (unsigned int i=0; i < word.size(); i++)
	{
		float offset = 1.5f;
		string letter = word.substr(i, 1);
		int frac = atoi(letter.c_str());

		switch (frac)
		{
		case 0:
			lines.push_back((local_pos));
			lines.push_back(colour);
			lines.push_back((local_pos + up + right));
			lines.push_back(colour);
			lines.push_back((local_pos));
			lines.push_back(colour);
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos));
			lines.push_back(colour);
			lines.push_back((local_pos + up));
			lines.push_back(colour);
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos + right + up));
			lines.push_back(colour);
			lines.push_back((local_pos + up));
			lines.push_back(colour);
			lines.push_back((local_pos + right + up));
			lines.push_back(colour);
			break;
		case 1:
			lines.push_back((local_pos));
			lines.push_back(colour);
			lines.push_back((local_pos + up));
			lines.push_back(colour);
			offset = 1.2f;
			break;
		case 2:
			lines.push_back((local_pos));
			lines.push_back(colour);
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up));
			lines.push_back(colour);
			lines.push_back((local_pos + up + right));
			lines.push_back(colour);
			lines.push_back((local_pos));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f));
			lines.push_back(colour);			
			lines.push_back((local_pos + up * 0.5f + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up + right));
			lines.push_back(colour);
			break;
		case 3:
			lines.push_back((local_pos));
			lines.push_back(colour);
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up));
			lines.push_back(colour);
			lines.push_back((local_pos + up + right));
			lines.push_back(colour);
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f + right));
			lines.push_back(colour);
			break;
		case 4:
			lines.push_back((local_pos + up * 0.5f));
			lines.push_back(colour);
			lines.push_back((local_pos + up));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f + right));
			lines.push_back(colour);
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up + right));
			lines.push_back(colour);
			break;
		case 5:
			lines.push_back((local_pos));
			lines.push_back(colour);
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up));
			lines.push_back(colour);
			lines.push_back((local_pos + up + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f));
			lines.push_back(colour);
			lines.push_back((local_pos + up));
			lines.push_back(colour);			
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos + right + up * 0.5f));
			lines.push_back(colour);
			break;
		case 6:
			lines.push_back((local_pos));
			lines.push_back(colour);
			lines.push_back((local_pos + up));
			lines.push_back(colour);
			lines.push_back((local_pos));
			lines.push_back(colour);
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f + right));
			lines.push_back(colour);
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos + right + up * 0.5f));
			lines.push_back(colour);
			break;
		case 7:
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos + right + up));
			lines.push_back(colour);
			lines.push_back((local_pos + up));
			lines.push_back(colour);
			lines.push_back((local_pos + up + right));
			lines.push_back(colour);
			break;
		case 8:
			lines.push_back((local_pos));
			lines.push_back(colour);
			lines.push_back((local_pos + up));
			lines.push_back(colour);
			lines.push_back((local_pos));
			lines.push_back(colour);
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up));
			lines.push_back(colour);
			lines.push_back((local_pos + up + right));
			lines.push_back(colour);
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos + right + up));
			lines.push_back(colour);
			break;
		case 9:
			lines.push_back((local_pos + up * 0.5f));
			lines.push_back(colour);
			lines.push_back((local_pos + up));
			lines.push_back(colour);
			lines.push_back((local_pos));
			lines.push_back(colour);
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f));
			lines.push_back(colour);
			lines.push_back((local_pos + up * 0.5f + right));
			lines.push_back(colour);
			lines.push_back((local_pos + up));
			lines.push_back(colour);
			lines.push_back((local_pos + up + right));
			lines.push_back(colour);
			lines.push_back((local_pos + right));
			lines.push_back(colour);
			lines.push_back((local_pos + right + up));
			lines.push_back(colour);
			break;
		}

		local_pos += right * offset;
	}
}

