export const migration019 = {
  id: '019_component_schema_type_normalization',
  sql: `
UPDATE component_type_settings
SET
  schema_json = REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(schema_json, '"type":"string"', '"type":"text"'),
                  '"type":"asset"', '"type":"assetRef"'
                ),
                '"type":"link"', '"type":"contentLink"'
              ),
              '"type":"list"', '"type":"stringList"'
            ),
            '"type":"subtype"', '"type":"objectList"'
          ),
          '"type":"complex"', '"type":"objectList"'
        ),
        '"type":"object"', '"type":"objectList"'
      ),
      '"type":"componentref"', '"type":"componentRef"'
    ),
    '"type":"objectref"', '"type":"objectRef"'
  ),
  updated_at = current_timestamp
WHERE schema_json IS NOT NULL;
`
};
