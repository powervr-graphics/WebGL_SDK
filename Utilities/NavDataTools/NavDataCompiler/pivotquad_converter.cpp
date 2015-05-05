/******************************************************************************

 @File         pivotquad_converter.cpp

 @Title        NavDataCompiler

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  None.

******************************************************************************/

#include <string>
#include <iostream>
#include <fstream>
using namespace std;

#include "PVRNavigation.h"
using namespace pvrnavigation;

/*!********************************************************************************************
 @Function		is_number
 @Input			c          The character to test.
 @Return 		True if the provided character is a number, false otherwise.
 @Description	Checks whether a certain character is a number or not.
***********************************************************************************************/
bool is_number(char c)
{
	switch (c)
	{
	case '0': case '1': case '2': case '3': case '4': 
	case '5': case '6': case '7': case '8': case '9': 
		{
			return true;
		}
	default:
		return false;
	}
}

/*!********************************************************************************************
 @Function		get_letter_spacing
 @Input			letter     The letter to calculate the width for.
 @Return 		The spacing of the letter.
 @Description	Looks up the spacing for a given letter where a single width letter is 4 units.
                (2 is half the width of regular letter, etc).
***********************************************************************************************/
unsigned int get_letter_spacing(char letter)
{
	switch (letter)
	{
	// Special cases like whitespaces only occupy a single width unit
	case ' ': case 'I': case '-':
		{
			return 2;
		}

	case '1': case 'L':
		{
			return 3;
		}

	case 'W':		
		{
			return 5;
		}
	
	// Every other character is two width units
	default:
		{
			return 4;
		}
	}
}

/*!********************************************************************************************
 @Function		get_height_indices
 @Input			letter     The letter to calculate the width for.
 @Output		starty     The start height of the character.
 @Output		endy       The end height of the character.
 @Description	Looks up the height for a given letter where a single letter height is five units
                and starts at zero.
***********************************************************************************************/
void get_height_indices(char letter, int &starty, int &endy)
{
	switch (letter)
	{
	case '-':
		{
			starty = 2;
			endy = 3;
			return;
		}

	// TODO: Special handling for lower case letters

	// Every other character starts at the bottom and reaches to the top
	default:
		{
			starty = 0;
			endy = 5;
			return;
		}
	}
}

/*!********************************************************************************************
 @Function		contains_ordinal
 @Input			name      The string to check.
 @Output		pos       The position of the ordinal.
 @Return 		True if the provided string contains an ordinal, false otherwise.
 @Description	Checks whether a given string includes a numeric ordinal (1ST, 2ND, 3RD, 4TH ...)
***********************************************************************************************/
bool contains_ordinal(const std::string &name, size_t &pos)
{
	const char *c_szOrdinals[] = { "TH ", "RD ", "ST ", "ND " };
	const unsigned int c_uiNumOrdinals = 4;

	// Scan if the string contains a number
	bool contains_number = false;
	for (unsigned int i=0; i < name.size(); i++)
		if (is_number(name[i]))
			contains_number = true;

	// No, so there can't be an ordinal
	if (!contains_number)
		return false;

	for (unsigned int i=0; i < c_uiNumOrdinals; i++)
	{
		pos = name.find(c_szOrdinals[i]);
		if (pos != string::npos)
		{
			return true;	
		}
	}

	return false;
}
	
/*!********************************************************************************************
 @Function		convert_texts
 @Input			layer          The map layer to extract the texts from.
 @Input			atlas          The texture atlas used for uv-coordinate calculation.
 @Output		pivotquads     The generated pivotquad vertex data.
 @Output		triangles      Triangle indices used for rendering of the pivotquads. 
 @Description	Generates pivotquads for the text strings which will be screen-space aligned
                when being rendered.
***********************************************************************************************/
void convert_texts(const PVRTMapLayer &layer, const PVRTTextureAtlas &atlas, PVRTPivotQuadVertexVector &pivotquads, PVRTTriangleVector &triangles)
{
	unsigned int numTotalLetters = 0;
	for (unsigned int j=0; j < layer.indexset.texts.size(); j++)
	{
		numTotalLetters += strlen(layer.indexset.texts[j].szName);
	}
	
	// Pre-allocate to prevent reallocations
	pivotquads.reserve(pivotquads.size() + numTotalLetters * 4);
	triangles.reserve(triangles.size() + numTotalLetters * 2);

	for (unsigned int j=0; j < layer.indexset.texts.size(); j++)
	{							
		const PVRTLinestrip &linestrip = layer.indexset.linestrips[layer.indexset.texts[j].index];
	
		string name(layer.indexset.texts[j].szName);
		unsigned int numLetters = name.length();

		float rand_pos = rand() / (float)RAND_MAX;
		// transform it to the range [0.2, 0.8] so that the streetnames are more in the middle of the street
		rand_pos = 0.2f + rand_pos * 0.6f;

		PVRTVec3 pos_3d = InterpolateLinestrip(layer.coordinates, linestrip, rand_pos);
		PVRTVec2 pos = PVRTVec2(pos_3d.x, pos_3d.y);

		int adjustedIndex = 0;
		unsigned int triangle_index = pivotquads.size();

		// Calculate the total width
		unsigned int word_width = 0;		
		for (unsigned int i=0; i < numLetters; i++)
			word_width += get_letter_spacing(name.at(i));
		const int anchor_index = word_width / 2;		

		size_t ordinal_pos;
		bool has_ordinal = contains_ordinal(name, ordinal_pos);

		for (unsigned int i=0; i < numLetters; i++)
		{					
			if (name.at(i) == ' ')
			{
				adjustedIndex += get_letter_spacing(name.at(i));				
				continue;
			}

			triangle_index = pivotquads.size();
			const int startIndex = adjustedIndex;
			int starty, endy;			
			
			// If it contains an ordinal and the current letter is one
			if (has_ordinal && ((i == ordinal_pos) || i == (ordinal_pos + 1)))
			{
				adjustedIndex += 2;
				starty = 2;
				endy = 5;
			}
			else
			{
				adjustedIndex += get_letter_spacing(name.at(i));				
				get_height_indices(name.at(i), starty, endy);				
			}
		
			string letter = name.substr(i, 1);

			PVRTMat3 texmat = atlas.GetTextureMatrix(letter);

			PVRTPivotQuadVertex vertex;
			vertex.origin = pos;

			PVRTVec3 uvcoords = texmat * PVRTVec3(0.0f, 0.0f, 255.0f);
			vertex.word_index = startIndex - anchor_index;
			vertex.height_index = starty;
			vertex.u = (PVRTuint8)(uvcoords.x);
			vertex.v = (PVRTuint8)(uvcoords.y);
			pivotquads.push_back(vertex);

			uvcoords = texmat * PVRTVec3(255.0f, 0.0f, 255.0f);
			vertex.word_index = adjustedIndex - anchor_index;
			vertex.height_index = starty;
			vertex.u = (PVRTuint8)(uvcoords.x);
			vertex.v = (PVRTuint8)(uvcoords.y);
			pivotquads.push_back(vertex);

			uvcoords = texmat * PVRTVec3(0.0f, 255.0f, 255.0f);

			vertex.word_index = startIndex - anchor_index;
			vertex.height_index = endy;
			vertex.u = (PVRTuint8)(uvcoords.x);
			vertex.v = (PVRTuint8)(uvcoords.y);
			pivotquads.push_back(vertex);

			uvcoords = texmat * PVRTVec3(255.0f, 255.0f, 255.0f);
			vertex.word_index = adjustedIndex - anchor_index;
			vertex.height_index = endy;
			vertex.u = (PVRTuint8)(uvcoords.x);
			vertex.v = (PVRTuint8)(uvcoords.y);
			pivotquads.push_back(vertex);

			PVRTTriangle t0 = { triangle_index, triangle_index + 1, triangle_index + 3 };
			PVRTTriangle t1 = { triangle_index, triangle_index + 3, triangle_index + 2 };

			triangles.push_back(t0);
			triangles.push_back(t1);				
		}
	}
}


/*!********************************************************************************************
 @Function		convert_signs
 @Input			layer          The map layer to extract the texts from.
 @Input			atlas          The texture atlas used for uv-coordinate calculation.
 @Output		pivotquads     The generated pivotquad vertex data.
 @Output		triangles      Triangle indices used for rendering of the pivotquads. 
 @Description	Generates pivotquads for the signs which will be screen-space aligned when being 
                rendered.
***********************************************************************************************/
void convert_signs(const PVRTMapLayer &layer, const PVRTTextureAtlas &atlas, PVRTPivotQuadVertexVector &pivotquads, PVRTTriangleVector &triangles)
{
	unsigned int numTotalSigns = layer.indexset.signs.size();
	
	// Pre-allocate to prevent reallocations
	pivotquads.reserve(pivotquads.size() + numTotalSigns * 4);
	triangles.reserve(triangles.size() + numTotalSigns * 2);
	
	for (unsigned int j=0; j < numTotalSigns; j++)
	{	
		const unsigned int index = pivotquads.size();

		string name(layer.indexset.signs[j].szName);
		
		PVRTVec2 pos = layer.indexset.signs[j].position;

		if (!atlas.Contains(name))
		{
			cerr << "Error: Texture atlas does not contain " << name << endl;
			continue;
		}

		PVRTMat3 texmat = atlas.GetTextureMatrix(name);
		PVRTVec3 uvcoords;

		PVRTPivotQuadVertex vertex;
		vertex.origin = pos;
		

		uvcoords = texmat * PVRTVec3(0.0f, 0.0f, 255.0f);
		vertex.word_index = 0;
		vertex.height_index = 0;
		vertex.u = (PVRTuint8)(uvcoords.x);
		vertex.v = (PVRTuint8)(uvcoords.y);
		pivotquads.push_back(vertex);

		uvcoords = texmat * PVRTVec3(255.0f, 0.0f, 255.0f);
		vertex.word_index = 1;
		vertex.height_index = 0;
		vertex.u = (PVRTuint8)(uvcoords.x);
		vertex.v = (PVRTuint8)(uvcoords.y);
		pivotquads.push_back(vertex);

		uvcoords = texmat * PVRTVec3(0.0f, 255.0f, 255.0f);
		vertex.word_index = 0;
		vertex.height_index = 1;
		vertex.u = (PVRTuint8)(uvcoords.x);
		vertex.v = (PVRTuint8)(uvcoords.y);
		pivotquads.push_back(vertex);

		uvcoords = texmat * PVRTVec3(255.0f, 255.0f, 255.0f);
		vertex.word_index = 1;
		vertex.height_index = 1;
		vertex.u = (PVRTuint8)(uvcoords.x);
		vertex.v = (PVRTuint8)(uvcoords.y);
		pivotquads.push_back(vertex);

		PVRTTriangle t0 = { index, index + 1, index + 3 };
		PVRTTriangle t1 = { index, index + 3, index + 2 };

		triangles.push_back(t0);
		triangles.push_back(t1);
	}		
}



/*!********************************************************************************************
 @Function		generate_border
 @Input			anchor_index      The anchor index to center the quad around.
 @Input			left_offset       The width of the quad left from the anchor.
 @Input			right_offset      The width of the quad right from the anchor.
 @Input			pivot             The pivot used for all vertices.
 @Input			texmat            The texture atlas used for uv-coordinate calculation.
 @Output		pivotquads        The generated pivotquad vertex data.
 @Output		triangle          Triangle indices used for rendering of the pivotquads. 
 @Description	Generates a single quad which can be used e.g. to render a rectangle behind text.
***********************************************************************************************/
void generate_border(const int anchor_index, const int left_offset, const int right_offset, const PVRTVec2 &pivot, PVRTMat3 &texmat, PVRTPivotQuadVertexVector &pivotquads, PVRTTriangleVector &triangles)
{
	unsigned int triangle_index = pivotquads.size();

	PVRTVec3 uvcoords;		
	PVRTPivotQuadVertex vertex;
	vertex.origin = pivot;

	// Left cap
	uvcoords = texmat * PVRTVec3(0.0f, 0.0f, 1.0f);
	vertex.word_index =  -anchor_index - left_offset;
	vertex.height_index = 0;
	vertex.u = (PVRTuint8)(uvcoords.x * 255.0f);
	vertex.v = (PVRTuint8)(uvcoords.y * 255.0f);
	pivotquads.push_back(vertex);

	uvcoords = texmat * PVRTVec3(0.5f, 0.0f, 1.0f);
	vertex.word_index = -anchor_index - left_offset + 1;
	vertex.height_index = 0;
	vertex.u = (PVRTuint8)(uvcoords.x * 255.0f);
	vertex.v = (PVRTuint8)(uvcoords.y * 255.0f);
	pivotquads.push_back(vertex);

	uvcoords = texmat * PVRTVec3(0.0f, 1.0f, 1.0f);
	vertex.word_index = -anchor_index - left_offset;
	vertex.height_index = 1;
	vertex.u = (PVRTuint8)(uvcoords.x * 255.0f);
	vertex.v = (PVRTuint8)(uvcoords.y * 255.0f);
	pivotquads.push_back(vertex);

	uvcoords = texmat * PVRTVec3(0.5f, 1.0f, 1.0f);
	vertex.word_index = -anchor_index - left_offset + 1;
	vertex.height_index = 1;
	vertex.u = (PVRTuint8)(uvcoords.x * 255.0f);
	vertex.v = (PVRTuint8)(uvcoords.y * 255.0f);
	pivotquads.push_back(vertex);

	PVRTTriangle t0 = { triangle_index, triangle_index + 1, triangle_index + 3 };
	PVRTTriangle t1 = { triangle_index, triangle_index + 3, triangle_index + 2 };

	triangles.push_back(t0);
	triangles.push_back(t1);
	triangle_index = pivotquads.size();

	// Middle part
	uvcoords = texmat * PVRTVec3(0.5f, 0.0f, 1.0f);
	vertex.word_index =  -anchor_index - left_offset + 1;
	vertex.height_index = 0;
	vertex.u = (PVRTuint8)(uvcoords.x * 255.0f);
	vertex.v = (PVRTuint8)(uvcoords.y * 255.0f);
	pivotquads.push_back(vertex);

	uvcoords = texmat * PVRTVec3(0.5f, 0.0f, 1.0f);
	vertex.word_index = anchor_index + right_offset - 1;
	vertex.height_index = 0;
	vertex.u = (PVRTuint8)(uvcoords.x * 255.0f);
	vertex.v = (PVRTuint8)(uvcoords.y * 255.0f);
	pivotquads.push_back(vertex);

	uvcoords = texmat * PVRTVec3(0.5f, 1.0f, 1.0f);
	vertex.word_index = -anchor_index - left_offset + 1;
	vertex.height_index = 1;
	vertex.u = (PVRTuint8)(uvcoords.x * 255.0f);
	vertex.v = (PVRTuint8)(uvcoords.y * 255.0f);
	pivotquads.push_back(vertex);

	uvcoords = texmat * PVRTVec3(0.5f, 1.0f, 1.0f);
	vertex.word_index = anchor_index + right_offset - 1;
	vertex.height_index = 1;
	vertex.u = (PVRTuint8)(uvcoords.x * 255.0f);
	vertex.v = (PVRTuint8)(uvcoords.y * 255.0f);
	pivotquads.push_back(vertex);

	PVRTTriangle t2 = { triangle_index, triangle_index + 1, triangle_index + 3 };
	PVRTTriangle t3 = { triangle_index, triangle_index + 3, triangle_index + 2 };

	triangles.push_back(t2);
	triangles.push_back(t3);
	triangle_index = pivotquads.size();

	// Right cap
	uvcoords = texmat * PVRTVec3(0.5f, 0.0f, 1.0f);
	vertex.word_index =  anchor_index + right_offset - 1;
	vertex.height_index = 0;
	vertex.u = (PVRTuint8)(uvcoords.x * 255.0f);
	vertex.v = (PVRTuint8)(uvcoords.y * 255.0f);
	pivotquads.push_back(vertex);

	uvcoords = texmat * PVRTVec3(1.0f, 0.0f, 1.0f);
	vertex.word_index = anchor_index + right_offset;
	vertex.height_index = 0;
	vertex.u = (PVRTuint8)(uvcoords.x * 255.0f);
	vertex.v = (PVRTuint8)(uvcoords.y * 255.0f);
	pivotquads.push_back(vertex);

	uvcoords = texmat * PVRTVec3(0.5f, 1.0f, 1.0f);
	vertex.word_index = anchor_index + right_offset - 1;
	vertex.height_index = 1;
	vertex.u = (PVRTuint8)(uvcoords.x * 255.0f);
	vertex.v = (PVRTuint8)(uvcoords.y * 255.0f);
	pivotquads.push_back(vertex);

	uvcoords = texmat * PVRTVec3(1.0f, 1.0f, 1.0f);
	vertex.word_index = anchor_index + right_offset;
	vertex.height_index = 1;
	vertex.u = (PVRTuint8)(uvcoords.x * 255.0f);
	vertex.v = (PVRTuint8)(uvcoords.y * 255.0f);
	pivotquads.push_back(vertex);

	PVRTTriangle t4 = { triangle_index, triangle_index + 1, triangle_index + 3 };
	PVRTTriangle t5 = { triangle_index, triangle_index + 3, triangle_index + 2 };

	triangles.push_back(t4);
	triangles.push_back(t5);
}

