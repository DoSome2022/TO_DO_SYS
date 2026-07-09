"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/utils/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: any;
  onSuccess: () => void;
}

export function EditEquipmentDialog({ open, onOpenChange, equipment, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [value, setValue] = useState("");
  const [team, setTeam] = useState("");
  const [notes, setNotes] = useState("");
  const [ownership, setOwnership] = useState("COMPANY_OWNED");

  const updateMutation = api.equipment.update.useMutation({
    onSuccess: () => {
      toast.success("設備已更新");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (equipment) {
      setName(equipment.name || "");
      setModel(equipment.model || "");
      setSerialNumber(equipment.serialNumber || "");
      setValue(equipment.value?.toString() || "");
      setTeam(equipment.team || "");
      setNotes(equipment.notes || "");
      setOwnership(equipment.ownership || "COMPANY_OWNED");
    }
  }, [equipment]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("設備名稱為必填");
      return;
    }

    await updateMutation.mutateAsync({
      id: equipment.id,
      name: name.trim(),
      model: model || undefined,
      serialNumber: serialNumber || undefined,
      value: value ? Number(value) : undefined,
      team: team || undefined,
      notes: notes || undefined,
      ownership: ownership as any,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>編輯設備：{equipment?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>設備名稱 *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="設備名稱" />
            </div>
            <div className="space-y-2">
              <Label>型號</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="型號" />
            </div>
            <div className="space-y-2">
              <Label>序號</Label>
              <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="SN" />
            </div>
            <div className="space-y-2">
              <Label>價值 ($)</Label>
              <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>設備分類</Label>
              <Input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="例如：攝影組" />
            </div>
            <div className="space-y-2">
              <Label>所有權</Label>
              <Select value={ownership} onValueChange={setOwnership}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPANY_OWNED">公司自有</SelectItem>
                  <SelectItem value="EXTERNAL_RENTAL">外部租借</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>備註</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="備註..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "儲存中..." : "儲存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
