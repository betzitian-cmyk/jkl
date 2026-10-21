with open("pipeline.py", "r") as f:
    lines = f.readlines()

for i in range(842, 888):
    if lines[i].strip():
        lines[i] = "    " + lines[i]

for i in range(926, 929):
    if lines[i].startswith("        "):
        lines[i] = lines[i][4:]

with open("pipeline.py", "w") as f:
    f.writelines(lines)
