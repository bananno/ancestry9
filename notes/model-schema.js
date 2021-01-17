{
  // In each schema list file, sort the list according to how attributes should appear in Edit Table.

  name: String
    /*
      The name of the attribute. Required.
    */


  // TYPE OF VALUE =============================================================

  dataType: String / classname
    /*
      Required (unless includeInSchema = false).
      The value will fall into one of these categories.
      1. REGULAR type
          - Options (as classname): String, Boolean, Number.
          - Also use "isList: true" if applicable.
          - This will transfer directly to the mongoose schema data type.
      2. REFERENCE type
          - Options (as string): the singular lowercase name of any model.
          - Also use "isList: true" if applicable.
          - Mongoose schema will be set up to reference the model.
      3. SPECIAL types
          - Options (as string): date, location.
          - Mongoose schema will be set up with applicable subattributes.
    */

  isList: Boolean
    /*
      Whether or not the property should be a list. Default false.
      Only applicable for REGULAR and REFERENCE types, not SPECIAL types.
    */

  defaultValue: String / Boolean / Number
    /*
      Transfers directly to the mongoose schema "default". No other functionality.
      Only applicable for REGULAR types, not REFERENCE or SPECIAL types.
    */


  // EDITING THE VALUE =========================================================

  isEditable: Boolean / Function
    /*
      Whether item is currently editable in the standard Edit Table.
      Two ways to use: boolean (default true) or method.
      If this is a method, it will receive the item itself as argument.
      Reasons why a property might not be editable:
        - The property is included during export, but not actually editable.
        - The property is edited in a different way, not part of the table.
        - The property is editable or not depending on other item properties.
      When includeInSchema = false, value is never editable, so do not specify isEditable.
    */

  showDisabledWhenNotEditable: Boolean
    /*
      Only applies when isEditable = false or when isEditable() returns false.
      Normally, not-editable properties will be hidden from the Edit Table.
      If true, the property will still show up, but will be disabled.
    */

  inputType: String
    /*
      Defines how the attribute is edited in the Edit Table.
      Must correspond with "type" property.
      Possible values:
        1. text
          HTML: <input>
          This is the default when "inputType" is undefined.
        2. textarea
          HTML: <textarea>
          Honors newlines. Saved attribute value will be displayed as <ul>.
        3. dropdown
          HTML: <select>
          The "type" property should be Number.
          Use "valueNames" property to define dropdown options.
        4. toggle
          Click a button to rotate through options.
          The "type" property should be Number or Boolean.
          For Number, use "valueNames" property to define the list of options.
    */

  valueNames: [String]
    /*
      Only applies (and is required) when dataType = Number and inputType is either
      dropdown or toggle. Defines the list of values to show (in the dropdown or
      toggle loop) instead of the integer value. The value will loop back to 0
      when it is toggled past the end of the list.
    */


  // LIST OVERRIDE METHODS =====================================================

  onAdd: Function
    /*
      Applies for any "isList" property.
      If present, this function will be called instead of the default update
      for adding items to the property value list.
    */

  onDelete: Function
    /*
      Applies for any "isList" property.
      If present, this function will be called instead of the default update
      for removing items from the property value list.
    */


  // PROPERTY LIMITATIONS ======================================================

  includeInSchema: Boolean
    /*
      Default TRUE.
      Whether to include the property in the mongoose schema.
      Usually applies to the "id" attribute, which is used for the export but
        is not defined in the mongoose schema.
    */

  includeInExport: Boolean
    /*
      Default TRUE.
      Whether or not the property should be included in the SHARED database export.
      Some properties (like the "shared" boolean property) are used for building
        the shared database but should not be included in the final file.
      (All properties are included in the BACKUP database export.)
    */

}
