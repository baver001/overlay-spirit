import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Shield, Calendar, LogOut, Trash2, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export const AccountProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('account.delete_confirm'))) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch('/api/auth?action=delete', { 
        method: 'DELETE',
        credentials: 'include' 
      });
      
      if (res.ok) {
        toast.success(t('account.account_deleted'));
        window.location.href = '/';
      } else {
        toast.error(t('account.delete_error'));
      }
    } catch (error) {
      toast.error(t('account.delete_error'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-600/20">
            <User className="h-5 w-5 text-violet-400" />
          </div>
          {t('account.profile')}
        </h1>
        <p className="text-white/60 mt-1">{t('account.profile_description')}</p>
      </div>

      {/* Profile Info */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-4 w-4 text-violet-400" />
            {t('account.account_info')}
          </CardTitle>
          <CardDescription className="text-white/50">
            {t('account.account_info_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-xl font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="font-medium text-white text-lg">
                {user?.email?.split('@')[0] || t('account.user')}
              </div>
              <div className="text-white/50 text-sm flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                {t('account.verified_email')}
              </div>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-white/70">{t('account.email')}</Label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-white/5 border-white/10 text-white/70"
            />
            <p className="text-xs text-white/40">{t('account.email_cannot_change')}</p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label className="text-white/70">{t('account.role')}</Label>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
              <Shield className="h-4 w-4 text-violet-400" />
              <span className="text-white capitalize">
                {user?.role === 'admin' ? t('account.role_admin') : t('account.role_customer')}
              </span>
            </div>
          </div>

          {/* Member Since */}
          <div className="space-y-2">
            <Label className="text-white/70">{t('account.member_since')}</Label>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
              <Calendar className="h-4 w-4 text-violet-400" />
              <span className="text-white/70">
                {/* Placeholder - would come from API */}
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-400" />
            {t('account.security')}
          </CardTitle>
          <CardDescription className="text-white/50">
            {t('account.security_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-violet-600/10 border-violet-500/30">
            <Shield className="h-4 w-4 text-violet-400" />
            <AlertDescription className="text-white/70">
              {t('account.magic_link_info')}
            </AlertDescription>
          </Alert>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            {t('account.logout_all_devices')}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-red-950/20 border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            {t('account.danger_zone')}
          </CardTitle>
          <CardDescription className="text-red-300/50">
            {t('account.danger_zone_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-600/30 hover:text-red-300"
          >
            {isDeleting ? t('account.deleting') : t('account.delete_account')}
          </Button>
          <p className="text-xs text-red-300/40 mt-2 text-center">
            {t('account.delete_warning')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountProfile;

