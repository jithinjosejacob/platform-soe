#!/bin/bash 

RED='\033[0;31m' 
GREEN='\033[0;32m' 
NC='\033[0m' 

echo -e "${NC}Please Download .env.json from ${RED}Vault ${NC}and provide the path to the file$" 

dev=false 
stg=false 

if [ $# -lt 2 ]; then 
    echo -e "Usage: $0 <json_file> [--dev|--stg]\n${RED}" 
    exit 1 
fi 

json_file="$1" 
shift # Shift arguments to process the flags 

while [[ "$#" -gt 0 ]]; do 

    case $1 in 
    --dev ) dev=true ;; 
    --stg ) stg=true ;; 
    * ) echo -e "${RED}Unknown option $1${NC}"; exit 1 ;; 
    esac 
    shift 
done 

if [ ! -f "$json_file" ]; then 
    echo -e "${RED}File not found: $json_file${NC}" 
    exit 1 
fi 

echo -e "${GREEN}Parsing JSON file... ${json_file}" 
json_data=$(cat "$json_file") 
echo -e "${GREEN}Parsing JSON file... ${json_file} done"

echo -e "${GREEN}Generating environment variables...${NC}" 

export_statements="" 

while IFS='=' read -r key value; do 

    export_statements+="export $key=\"$value\"\n" 
done < <(jq -r 'to_entries|map("\(.key)=\(.value|tostring)")|.[]' <<< "$json_data") 

echo -e "${GREEN}Generating environment variables... done${NC}" 

echo -e "${GREEN}Writing environment variables to file...${NC}" 
if [ "$dev" = true ]; then 
    output_file=".env.dev" 
elif [ "$stg" = true ]; then 
    output_file=".env.stg" 
else 
    echo -e "${RED}Please specify either --dev or --stg flag${NC}" 
    exit 1 
fi 

echo -e "$export_statements" > "$output_file" 
echo -e "${GREEN}Environment variables written to $output_file${NC}"