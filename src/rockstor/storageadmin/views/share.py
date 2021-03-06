"""
Copyright (c) 2012-2013 RockStor, Inc. <http://rockstor.com>
This file is part of RockStor.

RockStor is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published
by the Free Software Foundation; either version 2 of the License,
or (at your option) any later version.

RockStor is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
"""

"""
view for anything at the share level
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import (BasicAuthentication,
                                           SessionAuthentication)
from rest_framework.permissions import IsAuthenticated
from storageadmin.auth import DigestAuthentication
from django.db import transaction
from storageadmin.models import (Share, Snapshot, Disk, Qgroup, Pool)
from fs.btrfs import (add_share, remove_share, share_id, update_quota,
                      share_usage)
from storageadmin.serializers import ShareSerializer
from storageadmin.util import handle_exception

import logging
logger = logging.getLogger(__name__)


class ShareView(APIView):

    authentication_classes = (DigestAuthentication, SessionAuthentication,
                              BasicAuthentication,)
    permission_classes = (IsAuthenticated,)

    def get(self, request, sname=None):
        try:
            if (sname is None):
                return Response(ShareSerializer(Share.objects.all()).data)
            return Response(ShareSerializer(Share.objects.get(name=sname)).data)
        except Exception, e:
            handle_exception(e, request)

    @transaction.commit_on_success
    def post(self, request):
        try:
            pool_name = request.DATA['pool']
            share_name = request.DATA['name']
            size = int(request.DATA['size'])
            pool = None
            for p in Pool.objects.all():
                if (p.name == pool_name):
                    pool = p
                    break
            disk = Disk.objects.filter(pool=p)[0]
            add_share(pool_name, disk.name, share_name)
            sid = share_id(pool_name, disk.name, share_name)
            qgroup_id = '0/' + sid
            update_quota(pool_name, disk.name, qgroup_id, str(size))
            cur_usage = int(share_usage(pool_name, disk.name, qgroup_id))
            qgroup = Qgroup(uuid=qgroup_id)
            qgroup.save()
            s = Share(pool=pool, qgroup=qgroup, name=share_name, size=size,
                    free=(size - cur_usage))
            s.save()
            return Response(ShareSerializer(s).data)
        except Exception, e:
            handle_exception(e, request)

    @transaction.commit_on_success
    def delete(self, request):
        """
        For now, we delete all snapshots, if any of the share and delete the
        share itself.
        """
        try:
            share_name = request.DATA['name']
            if (Share.objects.filter(name=share_name).exists()):
                share = Share.objects.get(name=share_name)
                pool_device = Disk.objects.filter(pool=share.pool)[0].name
                remove_share(share.pool.name, pool_device, share_name)
                share.delete()
                return Response()
        except Exception, e:
            handle_exception(e, request)
