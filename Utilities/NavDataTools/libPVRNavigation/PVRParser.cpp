/******************************************************************************

 @File         PVRParser.cpp

 @Title        libPVRNavigation

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements a simple file parser.

******************************************************************************/

#include "PVRParser.h"

#include <fstream>
#include <string>
#include <sstream>
#include <vector>
#include <istream>
using namespace std;


namespace pvrnavigation
{

PVRParser::PVRParser()
{
}


PVRParser::~PVRParser()
{
}


bool PVRParser::parse(const char *pszFilename)
{
	ifstream file(pszFilename);
	if (!file.is_open())
		return false;

	return parse(file);
}

bool PVRParser::parse(istream &file)
{
	string filecontent;

	// now convert each line into a string and store
	while (!file.eof())
	{
		string line;		
		getline(file, line);

		// scan for comment sign '#' and remove line after that
		size_t pos = line.find('#');
		if (pos != string::npos)
		{
			// Replace the comment with a whitespace
			line.resize(pos);			
		}
		
		line.append(" ");
		filecontent.append(line);
	}

	m_szFileContent.str(filecontent);

	return true;
}

bool PVRParser::eof()
{
	return m_szFileContent.eof();
}


int PVRParser::parse_int()
{
	int result;
	m_szFileContent >> result;
	return result;
}

unsigned int PVRParser::parse_unsigned_int()
{
	unsigned int result;
	m_szFileContent >> result;
	return result;
}

float PVRParser::parse_float()
{
	float result;
	m_szFileContent >> result;
	return result;
}

bool PVRParser::parse_bool()
{
	int result;
	m_szFileContent >> result;
	return (result != 0);
}

string  PVRParser::parse_string()
{
	string result;
	m_szFileContent >> result;
	return result;
}

PVRTVec2 PVRParser::parse_PVRTVec2()
{
	PVRTVec2 result;
	result.x = parse_float();
	result.y = parse_float();	
	return result;
}

PVRTVec3 PVRParser::parse_PVRTVec3()
{
	PVRTVec3 result;
	result.x = parse_float();
	result.y = parse_float();
	result.z = parse_float();
	return result;
}

PVRTVec4 PVRParser::parse_PVRTVec4()
{
	PVRTVec4 result;
	result.x = parse_float();
	result.y = parse_float();
	result.z = parse_float();
	result.w = parse_float();
	return result;
}
	
PVRTMat3 PVRParser::parse_PVRTMat3()
{
	PVRTMat3 result;
	result[0][0] = parse_float();
	result[1][0] = parse_float();
	result[2][0] = parse_float();
	result[0][1] = parse_float();
	result[1][1] = parse_float();
	result[2][1] = parse_float();
	result[0][2] = parse_float();
	result[1][2] = parse_float();
	result[2][2] = parse_float();
	return result;
}

PVRTMat4 PVRParser::parse_PVRTMat4()
{
	PVRTMat4 result;
	result[0][0] = parse_float();
	result[0][1] = parse_float();
	result[0][2] = parse_float();
	result[0][3] = parse_float();
	result[1][0] = parse_float();
	result[1][1] = parse_float();
	result[1][2] = parse_float();
	result[1][3] = parse_float();
	result[2][0] = parse_float();
	result[2][1] = parse_float();
	result[2][2] = parse_float();
	result[2][3] = parse_float();
	result[3][0] = parse_float();
	result[3][1] = parse_float();
	result[3][2] = parse_float();
	result[3][3] = parse_float();
	return result;
}

};

/******************************************************************************
 End of file (PVRPARSER.cpp)
******************************************************************************/

