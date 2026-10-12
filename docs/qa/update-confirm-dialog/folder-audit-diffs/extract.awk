# usage: awk -v name="..." -f extract.awk file
/^### Requirement: / { inreq = (substr($0,18) == name) ; if (inreq) {print; next} }
/^## / { inreq=0 }
inreq { print }
