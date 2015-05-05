/******************************************************************************

 @File         PVRParser.h

 @Title        libPVRNavigation

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Implements a simple file parser.

******************************************************************************/

#ifndef _PVRPARSER__H_
#define _PVRPARSER__H_

#include <string>
#include <vector>
#include <sstream>
#include <istream>

#include "PVRTVector.h"

namespace pvrnavigation
{

class PVRParser
{
public:

	/*!********************************************************************************************
     @Function		Constructor
    ***********************************************************************************************/
	PVRParser();

	/*!********************************************************************************************
     @Function		Destructor
    ***********************************************************************************************/
	~PVRParser();

	/*!********************************************************************************************
     @Function		parse
     @Input			pszFilename    The name of the file to parse.
     @Return        True if successful, false otherwise.
     @Description	Parses the given text file.
    ***********************************************************************************************/
	bool parse(const char *pszFilename);

	/*!********************************************************************************************
     @Function		parse
     @Input			file    The file to parse.
     @Return        True if successful, false otherwise.
     @Description	Parses the given text file.
    ***********************************************************************************************/
	bool parse(std::istream &file);	

	/*!********************************************************************************************
     @Function		eof
     @Return        True if end of file reached, false otherwise.
     @Description	Indicates whether the end of file has been reached or not.
    ***********************************************************************************************/
	bool eof();

	/*!********************************************************************************************
     @Function		parse_int
     @Return        The parsed integer.
     @Description	Parses a 32bit integer from the file stream.
    ***********************************************************************************************/
	int          parse_int();

	/*!********************************************************************************************
     @Function		parse_unsigned_int
     @Return        The parsed unsigned integer.
     @Description	Parses a 32bit unsigned integer from the file stream.
    ***********************************************************************************************/
	unsigned int parse_unsigned_int();

	/*!********************************************************************************************
     @Function		parse_float
     @Return        The parsed float.
     @Description	Parses a float from the file stream.
    ***********************************************************************************************/
	float        parse_float();

	/*!********************************************************************************************
     @Function		parse_bool
     @Return        The parsed boolean.
     @Description	Parses a bool from the file stream.
    ***********************************************************************************************/
	bool         parse_bool();

	/*!********************************************************************************************
     @Function		parse_string
     @Return        The parsed string.
     @Description	Parses a string from the file stream.
    ***********************************************************************************************/
	std::string  parse_string();
	
	/*!********************************************************************************************
     @Function		parse_PVRTVec2
     @Return        The parsed two-component vector.
     @Description	Parses a PVRTVec2 from the file stream.
    ***********************************************************************************************/
	PVRTVec2     parse_PVRTVec2();

	/*!********************************************************************************************
     @Function		parse_PVRTVec3
     @Return        The parsed three-component vector.
     @Description	Parses a PVRTVec3 from the file stream.
    ***********************************************************************************************/
	PVRTVec3     parse_PVRTVec3();

	/*!********************************************************************************************
     @Function		parse_PVRTVec4
     @Return        The parsed four-component vector.
     @Description	Parses a PVRTVec4 from the file stream.
    ***********************************************************************************************/
	PVRTVec4     parse_PVRTVec4();
	
	/*!********************************************************************************************
     @Function		parse_PVRTMat3
     @Return        The parsed 3x3 matrix.
     @Description	Parses a PVRTMat3 from the file stream.
    ***********************************************************************************************/
	PVRTMat3     parse_PVRTMat3();

	/*!********************************************************************************************
     @Function		parse_PVRTMat4
     @Return        The parsed 4x4 matrix.
     @Description	Parses a PVRTMat4 from the file stream.
    ***********************************************************************************************/
	PVRTMat4     parse_PVRTMat4();
	
protected:

	std::istringstream m_szFileContent;

};

};


#endif // _PVRPARSER__H_

/******************************************************************************
 End of file (PVRPARSER.h)
******************************************************************************/

