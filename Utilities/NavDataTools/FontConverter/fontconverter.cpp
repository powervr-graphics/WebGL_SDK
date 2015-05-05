/******************************************************************************

 @File         fontconverter.cpp

 @Title        Font Converter

 @Version       @Description  Implements a basic font atlas conversion tool for the 

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements a basic font atlas conversion tool for the  bitmap font
               generator" from http://www.angelcode.com/.  It parses the font
               description file and outputs a texture atlas  description file
               which can be used for the texture atlas  in libPVRNavigation.

******************************************************************************/

#include <iostream>
#include <sstream>
#include <fstream>
#include <vector>
using namespace std;

#include <stdlib.h>

/****************************************************************************
 ** Structures
 ****************************************************************************/
struct GlyphDescription
{
	string name;
	float uvoffset[2];
	float uvdims[2];
};

/****************************************************************************
 ** Function declarations
 ****************************************************************************/
bool parse_glyph(ifstream &file, int w, int h, int border, GlyphDescription &glyph);
bool parse_header(ifstream &file, int &num_chars, int &width, int &height, int &border);

/*!****************************************************************************
 @Function		main
 *****************************************************************************/
int main(int argc, char **argv)
{
	// Check input
	if (argc != 3)
	{
		cerr << "Usage: " << argv[0] << " font_filename output_filename" << endl;
		return EXIT_FAILURE;
	}

	char *font_filename = argv[1];
	char *output_filename = argv[2];

	ifstream input_file(font_filename);
	if (!input_file.is_open())
	{
		cerr << "Could not open " << font_filename << endl;		
		return EXIT_FAILURE;
	}

	ofstream output_file(output_filename);
	if (!output_file.is_open())
	{
		cerr << "Could not open " << output_filename << endl;		
		return EXIT_FAILURE;
	}

	// Parse all header fields
	int width, height, num_glyphs, border;
	if (!parse_header(input_file, num_glyphs, width, height, border))
	{
		cerr << "Error, could not parse header." << endl;
		return EXIT_FAILURE;
	}

	// Parse all described glyphs
	vector<GlyphDescription> glyphs;
	for (int i=0; i < num_glyphs; i++)
	{
		GlyphDescription glyph;
		parse_glyph(input_file, width, height, border, glyph);
		glyphs.push_back(glyph);
	}

	// Remove a half-texel border 
	for (unsigned int i=0; i < glyphs.size(); i++)
	{
		float pixelwidth = 1.0f / (float)width;
		float pixelheight = 1.0f / (float)height;
		
		glyphs[i].uvoffset[0] += pixelwidth;
		glyphs[i].uvoffset[1] += pixelheight;
		glyphs[i].uvdims[0] -= pixelwidth * 2.0f;
		glyphs[i].uvdims[1] -= pixelheight * 2.0f;
	}

	// Write the texture atlas
	output_file << "# Texture Atlas definition file (" << font_filename << ")" << endl;
	output_file << "#" << endl;
	output_file << "# Width and height of the texture atlas" << endl;
	output_file << width << " " << height << endl;
	output_file << "# Number of textures which are in the texture (and where)" << endl;
	output_file << num_glyphs << endl;
	output_file << "# Texture name, uv start-coordinates, uv end-coordinates" << endl;
	for (int i=0; i < num_glyphs; i++)
		output_file << glyphs[i].name << "   " << glyphs[i].uvoffset[0] << "   " << glyphs[i].uvoffset[1] << "       " << glyphs[i].uvdims[0] << "   " << glyphs[i].uvdims[1] << endl;
	// Finshed writing texture atlas
	output_file.close();

	cout << "Finished converting " << font_filename << " to " << output_filename << endl;
	return EXIT_SUCCESS;
}

/*!****************************************************************************
 @Function		parse_token
 @Input			line      The line to search the token in.
 @Input			token     The string token to search. 
 @Input			value     The parsed value of the token.
 @Description	Extracts the value of a token/value tuple out of a string.
******************************************************************************/
bool parse_token(const string &line, const string &token, string &value)
{
	size_t start_pos = line.find(token);
	if (start_pos == string::npos)
	{
		cerr << "Could not parse token " << token << " from line: " << endl << line << endl;
		return false;
	}

	size_t end_pos = line.find(' ', start_pos + token.length() - 1);
	if (end_pos == string::npos)
	{
		// means we have reached end of line, set end position manually
		value = line.substr(start_pos + token.length());
	}
	else
	{
		value = line.substr(start_pos + token.length(), end_pos - start_pos - token.length());
	}

	return true;
}


/*!****************************************************************************
 @Function		parse_header
 @Input			file        The file to parse.
 @Output		num_chars   Number of characters stored in the atlas
 @Output		width       Width of image file in pixels.
 @Output		height      Height of image file in pixels.
 @Output		border      Number of pixels padded around the image.
 @Description	Extracts important configuration values out of the atlas header.
******************************************************************************/
bool parse_header(ifstream &file, int &num_chars, int &width, int &height, int &border)
{
	string line, value;		

	// skip first line
	getline(file, line);
	
	// second line
	getline(file, line);

	// extract width
	if (!parse_token(line, "scaleW=", value))
		return false;
	width = atoi(value.c_str());

	// extract height
	if (!parse_token(line, "scaleH=", value))
		return false;
	height = atoi(value.c_str());

	// third line
	getline(file, line);

	// extract height [optional parameter]
	if (parse_token(line, "border=", value))
	{
		border = atoi(value.c_str());
	}
	else
	{
		// default if not specified
		border = 0;
	}

	// fourth line
	getline(file, line);
	
	// extract number of characters	
	if (!parse_token(line, "chars count=", value))
		return false;
	num_chars = atoi(value.c_str());

	return true;	
}


/*!****************************************************************************
 @Function		parse_glyph
 @Input			file        The file to parse. 
 @Input			w           Width of image file in pixels.
 @Input			h           Height of image file in pixels.
 @Input			border      Number of pixels padded around the image.
 @Output		glyph       Attributes of the parsed glyph will be stored here.
 @Description	Extracts important configuration values out of the atlas header.
******************************************************************************/
bool parse_glyph(ifstream &file, int w, int h, int border, GlyphDescription &glyph)
{
	string line, value;

	// read the line
	getline(file, line);
	
	// extract character id
	if (!parse_token(line, "char id=", value))
		return false;
	int id = atoi(value.c_str());
	
	// extract x position
	if (!parse_token(line, "x=", value))
		return false;
	int xpos = atoi(value.c_str()) + border;

	// extract y position
	if (!parse_token(line, "y=", value))
		return false;
	int ypos = atoi(value.c_str()) + border;
		
	// extract width
	if (!parse_token(line, "width=", value))
		return false;
	int width = atoi(value.c_str());
	
	// extract height
	if (!parse_token(line, "height=", value))
		return false;
	int height = atoi(value.c_str());
	
	glyph.name = (char)id;
	glyph.uvoffset[0] = xpos / (float)(w + border);
	glyph.uvoffset[1] = ((h + border) - (ypos + height)) / (float)(h + border);
	glyph.uvdims[0] = width / (float)(w + border);	
	glyph.uvdims[1] = height / (float)(h + border);

	return true;
}

