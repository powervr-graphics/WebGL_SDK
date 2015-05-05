/******************************************************************************

 @File         osm_converter.cpp

 @Title        IntermediateFormatConverter

 @Version      

 @Copyright    Copyright (c) Imagination Technologies Limited. All Rights Reserved.

 @Platform     Independent

 @Description  Intermediate format data transformation adaptor using the OSM
               http://www.openstreetmap.org) file format to access data.

******************************************************************************/

#include "osm_converter.h"
#include "config.h"

#ifndef ENABLE_OSM_SUPPORT

#include <iostream>

bool OSM_process_data(const char *pszFile, std::vector<MapDescription> &layers)
{
	std::cerr << "OSM support disabled, please check config.h" << std::endl;
	return false;
}

#else // ENABLE_OSM_SUPPORT

#include <iostream>
#include <fstream>
#include <set>
#include <string>
using namespace std;

#include "PVRNavigation.h"
using namespace pvrnavigation;

#ifdef _WIN32
#define snprintf sprintf_s
#endif

struct osm_tag
{
	string key, value;
};

struct osm_node_base
{
	osm_node_base() : visible(false), id(-1), uid(-1), version(-1) {}
	bool visible;
	int id, uid, version;
	vector<osm_tag> tags;
};

struct osm_node : osm_node_base
{
	osm_node() : osm_node_base(), position(PVRTVec2(-1.0f)) {}

	PVRTVec2 position;
};

struct osm_way : osm_node_base
{
	osm_way() : osm_node_base() {}

	vector<unsigned int> refs;
};
static int global_debug_pos;
bool parse_xml_nodes(const string &str, string &content, unsigned int &pos);
bool extract_osm_nodes(const vector<string> &xml_nodes, vector<osm_node> &osm_nodes, vector<osm_way> &osm_ways, PVRTBoundingBox2D &bbox);
bool osm_get_tag_value(const osm_node_base &node, const string &key, string &value);

/*!*****************************************************************************************************
 @Function		OSM_process_data
 @Input			pszFile           The file containing the OSM data.
 @Input			layers            The extracted layer information will be stored in this vector.
 @Return                          True if successful, false otherwise.
 @Description	Extracts all data and stores it for later usage.
********************************************************************************************************/
bool OSM_process_data(const char *pszFile, std::vector<MapDescription> &layers)
{
	ifstream file(pszFile);
	if (!file.is_open())
		return false;

	cerr << "Reading file ... ";
	// Read file into string
	file.seekg(0, ios::end);   
	const unsigned int file_length = file.tellg();
	char *buffer = new char[file_length];	
	file.seekg(0, ios::beg);
	file.read(buffer, file_length);
	file.close();
	string file_content(buffer, file_length);
	delete [] buffer;
	cerr << "done." << endl;

	vector<string> xml_nodes;
	
	cerr << "Parsing xml nodes ... ";
	unsigned int file_pos = 0;
	const unsigned int min_tag_size = 5;
	while (file_pos < (file_length - min_tag_size))
	{
		string xml_node;
		if (parse_xml_nodes(file_content, xml_node, file_pos))		
			xml_nodes.push_back(xml_node);		
		else
			break;
	}
	cerr << "done." << endl;

	cerr << "Extracting nodes ... ";
	PVRTBoundingBox2D bbox;
	vector<osm_way> way_nodes;
	vector<osm_node> osm_nodes;	
	osm_nodes.push_back(osm_node());
	if (!extract_osm_nodes(xml_nodes, osm_nodes, way_nodes, bbox))
	{
		cerr << "Failed to extract osm nodes " << global_debug_pos << endl;
		return false;
	}
	cerr << "done." << endl;

	MapDescription mapdescription;	
	mapdescription.maplayer.boundingbox = bbox;

	// Generate the mapping for node ids and mapping into the vector
	map<unsigned int, unsigned int> vector_mapping;
	map<unsigned int, unsigned int> node_ref_counter;
	mapdescription.maplayer.coordinates.reserve(osm_nodes.size());
	for (unsigned int i=0; i < osm_nodes.size(); i++)
	{
		PVRTVertex coordinate;
		coordinate.texcoord = PVRTVec2(0.0f, 0.0f);
		coordinate.position = PVRTVec3(osm_nodes[i].position.x, osm_nodes[i].position.y, 0.0f);
		mapdescription.maplayer.coordinates.push_back(coordinate);
		vector_mapping[osm_nodes[i].id] = i;		
	}

	// Count how often a single node is being referenced in linestrips
	for (unsigned int i=0; i < way_nodes.size(); i++)
	{		
		osm_way &cur_node = way_nodes[i];
		for (unsigned int j=0; j < cur_node.refs.size(); j++)
			node_ref_counter[cur_node.refs[j]]++;
	}

	// Iterate over all way nodes and split them if one of them has a multiply used inner node
	cerr << "Splitting intersecting linestrips ... ";
	vector<osm_way> split_way_nodes;
	split_way_nodes.reserve(way_nodes.size());
	vector<osm_way> way_nodes_copy = way_nodes;
	unsigned int split_counter = 0;
	for (unsigned int i=0; i < way_nodes_copy.size(); i++)
	{
		const osm_way &cur_node = way_nodes_copy[i];
		const unsigned int num_refs = cur_node.refs.size();

		bool split_way = false;

		for (unsigned int j=1; j < num_refs-1; j++)
		{
			if (node_ref_counter[cur_node.refs[j]] > 1)
			{
				// TODO: Handle me
				split_way = true;
				split_counter++;

				osm_way prev = cur_node;
				prev.refs.clear();
				prev.refs.reserve(j);
				for (unsigned int k=0; k <= j; k++)
					prev.refs.push_back(cur_node.refs[k]);				
								
				osm_way next = cur_node;
				next.refs.clear();
				next.refs.reserve(num_refs - j);
				for (unsigned int k=j; k < num_refs; k++)
					next.refs.push_back(cur_node.refs[k]);

				way_nodes_copy.push_back(prev);
				way_nodes_copy.push_back(next);

				break;
			}
		}

		if (!split_way)
			split_way_nodes.push_back(cur_node);
	}	
	cerr << "done. Split " << split_counter << " linestrips." << endl;

	// Streets
	mapdescription.name = "Streets";
		
	for (unsigned int i=0; i < split_way_nodes.size(); i++)
	{		
		const osm_way &cur_way = split_way_nodes[i];

		string value;
		if (osm_get_tag_value(cur_way, "highway", value))
		{
			int func_class = -1;

			if (value == "motorway" || 
				value == "primary")
			{
				func_class = 1;
			}
			else if (value == "secondary")
			{
				func_class = 3;
			}
			else if (value == "road"   || 
				     value == "residential"   || 
					 value == "motorway_link" || 
				     value == "unclassified"  ||
				     value == "tertiary"      ||
				     value == "living_street" || 
				     value == "pedestrian"    ||
					 value == "footway"       ||
					 value == "trunk"         ||
					 value == "service"       ||
					 value == "path"          ||
					 value == "cycleway"      ||
					 value == "steps")
			{
				func_class = 5;
			}
			else
			{
				cerr << "Unhandled \'highway\' class: " << value << endl;
			}

			if (func_class > 0)
			{
				PVRTLinestrip linestrip;
				linestrip.func_class = func_class;
				linestrip.ref_in_id = cur_way.refs.front();
				linestrip.nref_in_id = cur_way.refs.back();
				linestrip.indices.reserve(cur_way.refs.size());
				for (unsigned int j=0; j < cur_way.refs.size(); j++)
					linestrip.indices.push_back(vector_mapping[cur_way.refs[j]]);
				mapdescription.maplayer.indexset.linestrips.push_back(linestrip);
			}
		}
	}	
	layers.push_back(mapdescription);

	// StreetsText
	mapdescription.maplayer.indexset.linestrips.clear();
	mapdescription.name = "StreetsText";
	
	for (unsigned int i=0; i < way_nodes.size(); i++)
	{		
		const osm_way &cur_way = way_nodes[i];

		string value;
		if (osm_get_tag_value(cur_way, "highway", value))
		{
			if (osm_get_tag_value(cur_way, "name", value))
			{
				PVRTLinestrip linestrip;
				linestrip.func_class = -1;
				linestrip.ref_in_id = cur_way.refs.front();
				linestrip.nref_in_id = cur_way.refs.back();
				linestrip.indices.reserve(cur_way.refs.size());
				for (unsigned int j=0; j < cur_way.refs.size(); j++)
					linestrip.indices.push_back(vector_mapping[cur_way.refs[j]]);
				mapdescription.maplayer.indexset.linestrips.push_back(linestrip);

				PVRTText text;
				text.index = mapdescription.maplayer.indexset.linestrips.size() - 1;
				strcpy(text.szName, value.c_str());
				mapdescription.maplayer.indexset.texts.push_back(text);
			}
		}
	}
	layers.push_back(mapdescription);
	
	// WaterPoly
	mapdescription.maplayer.indexset.linestrips.clear();
	mapdescription.name = "WaterPoly";
	
	for (unsigned int i=0; i < way_nodes.size(); i++)
	{		
		const osm_way &cur_way = way_nodes[i];

		string value;
		if (osm_get_tag_value(cur_way, "waterway", value))
		{
			if (value == "riverbank")
			{
				PVRTPolygon polygon;
				polygon.indices.reserve(cur_way.refs.size());
				for (unsigned int j=0; j < cur_way.refs.size(); j++)
					polygon.indices.push_back(vector_mapping[cur_way.refs[j]]);
				mapdescription.maplayer.indexset.polygons.push_back(polygon);
			}
			else
			{
				cerr << "Unhandled \'waterway\' class: " << value << endl;
			}
		}
	}
	layers.push_back(mapdescription);

	// LandUseA
	mapdescription.maplayer.indexset.polygons.clear();
	mapdescription.name = "LandUseA";
	
	for (unsigned int i=0; i < way_nodes.size(); i++)
	{		
		const osm_way &cur_way = way_nodes[i];

		string value;
		if (osm_get_tag_value(cur_way, "leisure", value))
		{
			if (value == "park"   ||
				value == "pitch"  ||
				value == "garden" ||
				value == "golf_course" ||
				value == "grass")
			{
				PVRTPolygon polygon;
				polygon.indices.reserve(cur_way.refs.size());
				for (unsigned int j=0; j < cur_way.refs.size(); j++)
					polygon.indices.push_back(vector_mapping[cur_way.refs[j]]);
				mapdescription.maplayer.indexset.polygons.push_back(polygon);
			}
			else
			{
				cerr << "Unhandled \'leisure\' class: " << value << endl;
			}
		}		
	}
	layers.push_back(mapdescription);

	// LandUseB
	mapdescription.maplayer.indexset.polygons.clear();
	mapdescription.name = "LandUseB";
	
	for (unsigned int i=0; i < way_nodes.size(); i++)
	{		
		const osm_way &cur_way = way_nodes[i];

		string value;
		if (osm_get_tag_value(cur_way, "landuse", value))
		{
			if (value == "commercial"   ||
				value == "construction" ||
				value == "market"       ||
				value == "retail"       ||
				value == "brownfield"   ||
				value == "allotments"   ||
				value == "grass")
			{
				PVRTPolygon polygon;
				polygon.indices.reserve(cur_way.refs.size());
				for (unsigned int j=0; j < cur_way.refs.size(); j++)
					polygon.indices.push_back(vector_mapping[cur_way.refs[j]]);
				mapdescription.maplayer.indexset.polygons.push_back(polygon);
			}
			else
			{
				cerr << "Unhandled \'landuse\' class: " << value << endl;
			}
		}		
	}
	layers.push_back(mapdescription);

	// LandMark
	mapdescription.maplayer.indexset.polygons.clear();
	mapdescription.name = "LandMark";
	
	for (unsigned int i=0; i < way_nodes.size(); i++)
	{		
		const osm_way &cur_way = way_nodes[i];

		string value;
		if (osm_get_tag_value(cur_way, "building", value))
		{
			if (value == "yes")
			{
				PVRTPolygon polygon;
				polygon.indices.reserve(cur_way.refs.size());
				for (unsigned int j=0; j < cur_way.refs.size(); j++)
					polygon.indices.push_back(vector_mapping[cur_way.refs[j]]);
				mapdescription.maplayer.indexset.polygons.push_back(polygon);
			}
		}		
	}
	layers.push_back(mapdescription);

	// Signs
	mapdescription.maplayer.indexset.polygons.clear();
	mapdescription.name = "Signs";
	
	for (unsigned int i=0; i < osm_nodes.size(); i++)
	{		
		const osm_node &cur_node = osm_nodes[i];

		string value;
		if (osm_get_tag_value(cur_node, "amenity", value))
		{
			if (value == "pub" ||
				value == "restaurant" ||
				value == "fast_food")
			{
				PVRTSign sign;
				sign.position = cur_node.position;
				snprintf(sign.szName, sizeof(sign.szName), "5800");
				mapdescription.maplayer.indexset.signs.push_back(sign);
			}

			if (value == "cafe")
			{
				PVRTSign sign;
				sign.position = cur_node.position;
				snprintf(sign.szName, sizeof(sign.szName), "9996");
				mapdescription.maplayer.indexset.signs.push_back(sign);
			}

			if (value == "cinema")
			{
				PVRTSign sign;
				sign.position = cur_node.position;
				snprintf(sign.szName, sizeof(sign.szName), "7832");
				mapdescription.maplayer.indexset.signs.push_back(sign);
			}

			if (value == "hospital")
			{
				PVRTSign sign;
				sign.position = cur_node.position;
				snprintf(sign.szName, sizeof(sign.szName), "8060");
				mapdescription.maplayer.indexset.signs.push_back(sign);
			}

			if (value == "pharmacy")
			{
				PVRTSign sign;
				sign.position = cur_node.position;
				snprintf(sign.szName, sizeof(sign.szName), "9565");
				mapdescription.maplayer.indexset.signs.push_back(sign);
			}

			if (value == "hotel" ||
				value == "motel" ||
				value == "bed_and_breakfast")
			{
				PVRTSign sign;
				sign.position = cur_node.position;
				snprintf(sign.szName, sizeof(sign.szName), "7011");
				mapdescription.maplayer.indexset.signs.push_back(sign);
			}
		}		
	}
	layers.push_back(mapdescription);

	
	return true;
}



void skip_whitechars(const string &str, unsigned int &pos)
{
	const unsigned int str_length = str.length();
	char c = str[pos];
	while (c == ' ' || c == '\n' && pos < str_length)
	{
		c = str[++pos];
	}
}

bool parse_xml_nodes(const string &str, string &content, unsigned int &pos)
{
	skip_whitechars(str, pos);

	unsigned int start_pos = pos;

	char c = str[pos];
	if (c != '<')
	{
		cerr << "Incorrect tag at " << start_pos << ", expected < " << endl;
		return false;
	}
	
	unsigned int level = 1;

	while (c != '>' && level != 0)
	{
		c = str[++pos];
		if (c == '<') level++;
		if (c == '>') level--;		
	}

	unsigned int end_pos = ++pos;
	int size = end_pos - start_pos;

	content = str.substr(start_pos, size);

	return true;
}

bool parse_tag(const string &str, const string &tag, string &val)
{
	unsigned int pos = str.find(tag);
	if (pos != string::npos)
	{
		//unsigned int a = str.find('\"', pos+tag.length());
		unsigned int a = str.find_first_of("\"\'", pos+tag.length());
		if (a == string::npos) return false;
		//unsigned int b = str.find('\"', a+1);
		unsigned int b = str.find_first_of("\"\'", a+1);
		if (b == string::npos) return false;
		val = str.substr(a+1, b-a-1);
	}
	else
		return false;

	return true;
}

void tokenize_string(const string &str, char separator, vector<string> &tokens)
{
	string tmp_str = str;
	while (true)
	{
		unsigned int pos = tmp_str.find(separator);
		if (pos == string::npos)
		{
			tokens.push_back(tmp_str);
			break;
		}
		else
		{
			tokens.push_back(tmp_str.substr(0, pos));
			tmp_str = tmp_str.substr(pos + 1);			
		}
	} 
}


bool osm_get_tag_value(const osm_node_base &node, const string &key, string &value)
{
	for (unsigned int i=0; i < node.tags.size(); i++)
	{
		if (node.tags[i].key == key)
		{
			value = node.tags[i].value;
			return true;
		}
	}
	return false;
}


bool extract_osm_base_tags(const string &str, osm_node_base &node)
{
	string value;

	if (parse_tag(str, "id=", value)) node.id = atoi(value.c_str());
	else return false;	
	if (parse_tag(str, "uid=", value)) node.uid = atoi(value.c_str());
	//else return false;
	if (parse_tag(str, "visible=", value)) node.visible = ((value == "true") ? true : false);
	//else return false;
	if (parse_tag(str, "version=", value)) node.version = atoi(value.c_str());
	//else return false;

	return true;
}

bool extract_osm_node_tags(const string &str, osm_node &node)
{
	string value;

	if (parse_tag(str, "lat=", value)) node.position.y = (float)atof(value.c_str());
	else return false;
	if (parse_tag(str, "lon=", value)) node.position.x = (float)atof(value.c_str());
	else return false;

	return true;
}

bool extract_osm_node(const vector<string> &xml_nodes, unsigned int &index, osm_node &node)
{
	bool node_with_tags = true;

	const string &cur_node = xml_nodes[index];
	// Check if the current node is a osm node
	if (cur_node.find("<node") == string::npos)
		return false;
	// check if there are tags associated with it (means it isn't closed with />)
	if (cur_node.find("/>") != string::npos)
		node_with_tags = false;
	// if there are no tags, then there should be a node-ending
	if (!node_with_tags)
		if (cur_node.find(">") == string::npos)
			return false;

	if (node_with_tags)
	{		
		unsigned int i;
		for (i=index+1; xml_nodes[i].find("</node>") == string::npos; i++) 
		{
			osm_tag cur_tag;
			parse_tag(xml_nodes[i], "k=", cur_tag.key);
			parse_tag(xml_nodes[i], "v=", cur_tag.value);
			node.tags.push_back(cur_tag);
		}
		index = i;
	}

	if (extract_osm_base_tags(cur_node, node) &&
		extract_osm_node_tags(cur_node, node))
	{
		return true;
	}
	else
	{
		cerr << "Failed to extract node " << index << endl;
		return false;
	}

	return true;
}

bool extract_osm_way(const vector<string> &xml_nodes, unsigned int &index, osm_way &node)
{
	bool node_with_tags = true;

	const string &cur_node = xml_nodes[index];
	// Check if the current node is a osm node
	if (cur_node.find("<way") == string::npos)
		return false;
	// check if there are tags associated with it (means it isn't closed with />)
	if (cur_node.find("/>") != string::npos)
		node_with_tags = false;
	// if there are no tags, then there should be a node-ending
	if (!node_with_tags)
		if (cur_node.find(">") == string::npos)
			return false;

	if (node_with_tags)
	{		
		unsigned int i;
		for (i=index+1; xml_nodes[i].find("</way>") == string::npos; i++) 
		{
			if (xml_nodes[i].find("<nd") != string::npos)
			{
				string value;
				int ref;
				//if (parse_tag(xml_nodes[i], "ref=", value)) ref = atoi(value.c_str());
				if (parse_tag(xml_nodes[i], "ref=", value)) ref = strtoul(value.c_str(), NULL, 10);
				else return false;
				node.refs.push_back(ref);
			}
			else if (xml_nodes[i].find("<tag") != string::npos)
			{
				osm_tag cur_tag;
				parse_tag(xml_nodes[i], "k=", cur_tag.key);
				parse_tag(xml_nodes[i], "v=", cur_tag.value);
				node.tags.push_back(cur_tag);
			}
		}
		index = i;
	}

	if (extract_osm_base_tags(cur_node, node))
	{
		return true;
	}
	else
	{
		cerr << "Failed to extract node " << index << endl;
		return false;
	}

	return true;
}

bool extract_osm_nodes(const vector<string> &xml_nodes, vector<osm_node> &osm_nodes, vector<osm_way> &osm_ways, PVRTBoundingBox2D &bbox)
{
	const unsigned int num_xml_nodes = xml_nodes.size();
	for (unsigned int i=0; i < num_xml_nodes; i++)
	{
		global_debug_pos = i;

		if (xml_nodes[i].find("<node ") != string::npos)
		{
			osm_node node;
			unsigned int prev_i = i;
			if (!extract_osm_node(xml_nodes, i, node))
			{
				cerr << "extract_osm_node(" << i << ") failed" << endl;
				return false;
			}
			else
			{
				osm_nodes.push_back(node);				
			}
		}
		else if (xml_nodes[i].find("<way") != string::npos)
		{
			osm_way way;
			if (!extract_osm_way(xml_nodes, i, way))
			{
				cerr << "extract_osm_way(" << i << ") failed" << endl;
				return false;
			}
			else
				osm_ways.push_back(way);
		}
		else if (xml_nodes[i].find("<relation ") != string::npos)
		{
			// Check if this node contains tags to skip
			if (xml_nodes[i].find("/>") == string::npos)
			{
				while ((xml_nodes[++i].find("</relation>") == string::npos) && (i < num_xml_nodes))
					;
			}
		}
		else if (xml_nodes[i].find("<bounds ") != string::npos)
		{			
			string value;
			if (parse_tag(xml_nodes[i], "minlat=", value)) bbox.minCoords.y = (float)atof(value.c_str());
			else return false;
			if (parse_tag(xml_nodes[i], "minlon=", value)) bbox.minCoords.x = (float)atof(value.c_str());
			else return false;
			if (parse_tag(xml_nodes[i], "maxlat=", value)) bbox.maxCoords.y = (float)atof(value.c_str());
			else return false;
			if (parse_tag(xml_nodes[i], "maxlon=", value)) bbox.maxCoords.x = (float)atof(value.c_str());
			else return false;
		}
		else if (xml_nodes[i].find("<bound ") != string::npos)
		{			
			string value;			
			if (!parse_tag(xml_nodes[i], "box=", value)) return false;
			vector<string> tokens;
			tokenize_string(value, ',', tokens);
			if (tokens.size() != 4) return false;
			bbox.minCoords.x = (float)atof(tokens[1].c_str());
			bbox.minCoords.y = (float)atof(tokens[0].c_str());
			bbox.maxCoords.x = (float)atof(tokens[3].c_str());
			bbox.maxCoords.y = (float)atof(tokens[2].c_str());
		}
	}

	return true;
}

#endif // #ifdef(ENABLE_OSM_SUPPORT)

