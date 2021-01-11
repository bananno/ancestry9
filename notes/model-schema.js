{
  name // name of the attribute

  // TYPE OF VALUE (use one)

  type // options: String, Boolean, Number

  specialType // options: tags, location, date

  references // the name of another model

  // OTHER DATA FORMAT

  isArray

  defaultValue

  // OPTIONS FOR EDITING THE VALUE

  inputType: String
    /*
      Defines how the attribute is edited.
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

  showInEditTable // default true

  valueNames // for type:number + inputType:toggle, a list of strings to show instead of integer

  maxValue // for type:number + inputType:toggle, the max value before returning to 0

  // optional methods

  onAdd
  onDelete
  onlyEditableIf
  onlyShareableIf

  // OTHER

  includeInSchema // default true

  includeInExport

}
