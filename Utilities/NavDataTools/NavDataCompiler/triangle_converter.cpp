/******************************************************************************

 @File         triangle_converter.cpp

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

#include "common.h"


struct TextOffsets
{
	PVRTVec2 offset;
	PVRTVec2 span;
	bool undefined;
};

struct TextBoundingBox
{
	PVRTBoundingBox2D    bbox;
	PVRTCoordinateVector coordinates;
	PVRTTriangleVector   triangles;
};

/*!********************************************************************************************
 @Function		calculate_text_offsets
 @Input			name              The string to calculate the offsets for.
 @Input			default_offset    Default offset when no letter-specific information is available.
 @Input			atlas             The texture atlas used for uv-coordinate calculation.
 @Output		attribs           The calculated offsets for each character.
 @Return		The summed width of all characters.
 @Description	Calculates the width of all characters based on the width in the texture atlas.
***********************************************************************************************/
float calculate_text_offsets(const string &name, const float default_offset, const PVRTTextureAtlas &atlas, vector<TextOffsets> &attribs)
{
	float total_length = 0.0f;

	size_t ordinal_pos;
	bool has_ordinal = contains_ordinal(name, ordinal_pos);

	for (unsigned int i=0; i < name.size(); i++)
	{	
		TextOffsets textoffsets;
		textoffsets.offset = PVRTVec2(0.0f, 0.0f);
		textoffsets.span = PVRTVec2(0.0f, 0.0f);
		textoffsets.undefined = false;

		const string letter = name.substr(i, 1);
		
		if (letter[0] == ' ')
		{
			textoffsets.span.x = default_offset;
			textoffsets.undefined = true;
		}
		else
		{	
			if (!atlas.GetTextureSpan(letter, textoffsets.span))
			{
				textoffsets.span.x = default_offset;
			}		
			else
			{
				textoffsets.offset.y = -textoffsets.span.y * 0.5f;

				if (has_ordinal)
				{				
					if (i == ordinal_pos || i == (ordinal_pos + 1))
					{
						// Ordinals start at half height
						textoffsets.offset.y += textoffsets.span.y * 0.5f;
						// and the letter is only half it's original size
						textoffsets.span *= 0.5f;
					}								
				}
			}
		}

		total_length += textoffsets.span.x;
		attribs.push_back(textoffsets);
	}

	return total_length;
}

/*!********************************************************************************************
 @Function		convert_text_to_triangles
 @Input			layer          The map layer to extract the texts from.
 @Input			atlas          The texture atlas used for uv-coordinate calculation.
 @Output		coordinates    The generated triangle vertex data.
 @Output		triangles      Triangle indices used for rendering of the triangles. 
 @Description	Generates texture mappable triangles for the text strings.
***********************************************************************************************/
void convert_text_to_triangles(const PVRTMapLayer &layer, const PVRTTextureAtlas &atlas, PVRTVec2 scale, PVRTCoordinateVector &coordinates, PVRTTriangleVector &triangles)
{	
	unsigned int numTotalLetters = 0;
	for (unsigned int j=0; j < layer.indexset.texts.size(); j++)
	{
		numTotalLetters += strlen(layer.indexset.texts[j].szName);
	}
	
	// Pre-allocate to prevent reallocations
	coordinates.reserve(coordinates.size() + numTotalLetters * 4);
	triangles.reserve(triangles.size() + numTotalLetters * 2);

	// This is the offset for letters not found in the texture atlas (and whitespaces)
	const float undefined_letter_span = 0.1f;
	const float margin = 0.00001f;

	vector<TextBoundingBox> text_bboxes;
	unsigned int skipped_texts = 0;

	for (unsigned int j=0; j < layer.indexset.texts.size(); j++)
	{			
		// Get reference to the current linestrip
		const PVRTLinestrip &linestrip = layer.indexset.linestrips[layer.indexset.texts[j].index];
			
		// Convert it into a string for easier handling
		string name(layer.indexset.texts[j].szName);
		unsigned int numLetters = name.length();	

		const float linestrip_length = CalculateLinestripLength(layer.coordinates, linestrip) - margin * 2.0f;
		const float inv_linestrip_length = 1.0f / linestrip_length;
		vector<TextOffsets> textoffsets;
		float word_length = calculate_text_offsets(name, 0.1f, atlas, textoffsets);
		
		word_length *= scale.x;
		PVRTVec2 word_scale = scale;
		float avg_letter_length = word_length / (float)numLetters;
		float start_pos = margin;

		if (word_length > linestrip_length)
		{
			float adjusted_scale = linestrip_length / word_length;
			word_scale *= adjusted_scale;			
		}
		else
		{
			start_pos = (linestrip_length - word_length) * 0.5f;
		}
						
		float word_pos = start_pos;				
		PVRTVertex vertex;
		PVRTVec3 uvcoords;

		TextBoundingBox text_bbox;
		text_bbox.bbox.minCoords = text_bbox.bbox.maxCoords = InterpolateLinestrip(layer.coordinates, linestrip, word_pos * inv_linestrip_length);

		// Generate two triangles for each letter
		for (unsigned int i=0; i < numLetters; i++)
		{	
			float word_pos_inc = textoffsets[i].span.x * word_scale.x * 1.000001f; ;

			if (textoffsets[i].undefined)
			{
				word_pos += word_pos_inc;
				continue;
			}											

			// Calculate start position and direction
			PVRTVec3 pos = InterpolateLinestrip(layer.coordinates, linestrip, word_pos * inv_linestrip_length);
			PVRTVec3 next_pos = InterpolateLinestrip(layer.coordinates, linestrip, (word_pos + avg_letter_length) * inv_linestrip_length);
			word_pos += word_pos_inc;		

			// Calculate local coordinate system in which the letter will be generated
			PVRTVec3 dir = (next_pos - pos);		
			PVRTVec3 up = PVRTVec3(-dir.y, dir.x, dir.z);
			float dir_length = dir.length();
			if (dir_length < 0.0000000001f)
				continue;
			float inv_length = 1.0f / dir_length;

			const string letter = name.substr(i, 1);
			PVRTMat3 texmat = atlas.GetTextureMatrix(letter);
			
			const unsigned int triangle_index = text_bbox.coordinates.size();
			
			PVRTVec3 offset_origin = pos;
			offset_origin += dir * (textoffsets[i].offset.x * word_scale.x * inv_length);
			offset_origin += up * (textoffsets[i].offset.y * word_scale.y * inv_length);

			// lower left
			vertex.position = offset_origin;
			uvcoords = texmat * PVRTVec3(0.0f, 0.0f, 1.0f);			
			vertex.texcoord.x = uvcoords.x;
			vertex.texcoord.y = uvcoords.y;
			text_bbox.coordinates.push_back(vertex);
			text_bbox.bbox.Extend(vertex.position);

			// lower right
			vertex.position = (offset_origin + dir * (textoffsets[i].span.x * word_scale.x * inv_length));
			uvcoords = texmat * PVRTVec3(1.0f, 0.0f, 1.0f);			
			vertex.texcoord.x = uvcoords.x;
			vertex.texcoord.y = uvcoords.y;
			text_bbox.coordinates.push_back(vertex);
			text_bbox.bbox.Extend(vertex.position);

			// upper left
			vertex.position = (offset_origin + up * (textoffsets[i].span.y * word_scale.y * inv_length));
			uvcoords = texmat * PVRTVec3(0.0f, 1.0f, 1.0f);			
			vertex.texcoord.x = uvcoords.x;
			vertex.texcoord.y = uvcoords.y;
			text_bbox.coordinates.push_back(vertex);
			text_bbox.bbox.Extend(vertex.position);

			// upper right
			vertex.position = (offset_origin + dir * (textoffsets[i].span.x * word_scale.x * inv_length) + up * (textoffsets[i].span.y * word_scale.y * inv_length));
			uvcoords = texmat * PVRTVec3(1.0f, 1.0f, 1.0f);			
			vertex.texcoord.x = uvcoords.x;
			vertex.texcoord.y = uvcoords.y;
			text_bbox.coordinates.push_back(vertex);		
			text_bbox.bbox.Extend(vertex.position);

			PVRTTriangle t0 = { triangle_index, triangle_index + 1, triangle_index + 3 };
			PVRTTriangle t1 = { triangle_index, triangle_index + 3, triangle_index + 2 };
	
			text_bbox.triangles.push_back(t0);
			text_bbox.triangles.push_back(t1);
		}

		bool add = true;
		for (unsigned int i=0; i < text_bboxes.size(); i++)
		{
			if (text_bboxes[i].bbox.Overlaps(text_bbox.bbox))
			{
				add = false;
				break;
			}
		}
		if (add) text_bboxes.push_back(text_bbox);
		else skipped_texts++;
	}

	for (unsigned int i=0; i < text_bboxes.size(); i++)
	{
		const unsigned int offset = coordinates.size();
		const TextBoundingBox &bbox = text_bboxes[i];

		coordinates.insert(coordinates.end(), bbox.coordinates.begin(), bbox.coordinates.end());

		for (unsigned int j=0; j < bbox.triangles.size(); j++)
		{			
			PVRTTriangle tri = bbox.triangles[j];
			tri.a += offset;
			tri.b += offset;
			tri.c += offset;
			triangles.push_back(tri);
		}
	}

	cerr << "Skipped " << skipped_texts << " overlapping texts." << endl;
}

