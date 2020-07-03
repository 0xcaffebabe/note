# getcheckin - Retrieve the last committed checkin date and time for
#              each of the files in the git project.  After a "pull"
#              of the project, you can update the timestamp on the
#              pulled files to match that date/time.  There are many
#              that believe that this is not a good idea, but
#              I found it useful to get the right source file dates
#
#              NOTE: This script produces commands suitable for
#                    piping into BASH or other shell
# License: Creative Commons Attribution 3.0 United States
# (CC by 3.0 US)

##########
# walk back to the project parent or the relative pathnames don't make
# sense
##########

# this script make all file's change date same to git history
while [ ! -d ./.git ]
do
    cd ..
done
echo "cd $(pwd)"
##########
# Note that the date format is ISO so that touch will work
##########
git ls-tree -r --full-tree HEAD |\
    sed -e "s/.*\t//" | while read filename; do
    echo "touch --date=\"$(git log -1 --date=iso --format="%ad" -- "$filename")\" -m '$filename'" 
done