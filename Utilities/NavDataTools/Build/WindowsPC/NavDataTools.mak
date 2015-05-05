#############################################################################
## Globals
#############################################################################
DEVRELROOT = $(MAKEDIR)\..\..\..\..
!INCLUDE $(DEVRELROOT)\Builds\pathdefs.mak

INCLUDE  = $(PLATFORMSDKINCLUDE);$(VCTOOLKIT2003INCLUDE)
LIB      = $(PLATFORMSDKLIB);$(VCTOOLKIT2003LIB)
PATH     = $(VCTOOLKIT2003PATH);$(PLATFORMSDKPATH)

SRCDIR = ..\..
OUTDIR = Release
OBJFILES = $(OUTDIR)\Filewrap.obj $(OUTDIR)\main.obj

CFLAGS = /D "WIN32" /D "NDEBUG" /D "_CONSOLE" /FD /EHsc /ML /GS /W3 /nologo /c /Wp64 /TP

LFLAGS = /INCREMENTAL:NO /NOLOGO /SUBSYSTEM:CONSOLE /OPT:REF /OPT:ICF /MACHINE:X86

all: $(OUTDIR) $(OUTDIR)\Filewrap.exe

$(OUTDIR):
	md $@

$(OUTDIR)\Filewrap.exe : $(OBJFILES)
	link.exe $(OBJFILES) $(LFLAGS) /OUT:$@

{$(SRCDIR)}.cpp{$(OUTDIR)}.obj:
	cl.exe $(CFLAGS) /Fo"$(OUTDIR)/" $**
