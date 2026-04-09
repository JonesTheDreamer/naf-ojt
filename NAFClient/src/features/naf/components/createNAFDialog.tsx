import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import search from "@/assets/images/search.svg";

// import { Field, FieldGroup } from "@/components/ui/field";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import SearchBar from "../../../components/common/searchbar";
import type { Employee } from "@/types/api/employee";
import { useEffect, useState } from "react";
import { searchEmployees } from "@/services/EntityAPI/employeeService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { useNAF } from "../hooks/useNAF";
import { useResource } from "@/features/resources/hooks/useResource";
import { SelectComponent } from "@/global/component/select";
import { Hardware } from "@/types/enum/hardware";

import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel } from "@/components/ui/field";

export function CreateNAFDialog() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [open, setOpen] = useState<boolean>(false);
  const [showEmployeeHasNAFAlert, setShowEmployeeHasNAFAlert] =
    useState<boolean>(false);
  const [toRequest, setToRequest] = useState<number[]>([]);
  const [selectedHardware, setSelectedHardware] = useState<Hardware>(
    Hardware.None,
  );

  const {
    employeeNAFs,
    createNAFAsync,
    isLoading: employeeLoading,
  } = useNAF({ employeeId: selectedEmployee?.id });

  // const { createNAFAsync } = useNAF();

  const {
    getAllResource,
    isLoading: resourceLoading,
  } = useResource();

  const loading = employeeLoading || resourceLoading;
  

  const fetchEmployee = async (query: string): Promise<Employee[]> => {
    try {
      const fetch = await searchEmployees(query);
      return fetch;
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  function EmployeeHasNAFAlert() {
    return (
      selectedEmployee && (
        <Alert variant="destructive" className="max-w-md">
          <AlertCircleIcon />
          <AlertTitle>Can't proceed on creating NAF</AlertTitle>
          <AlertDescription>
            Employee {selectedEmployee.id} already has NAF for
            <br />
            {selectedEmployee.departmentDesc
              ? selectedEmployee.departmentDesc
              : "department"}
            <br />
          </AlertDescription>
        </Alert>
      )
    );
  }
  function HardwareSelect() {
    return (
      <SelectComponent<Hardware>
        label="Hardwares"
        placeholder="None"
        value={selectedHardware}
        onValueChange={setSelectedHardware}
        options={[
          { value: Hardware.None, display: "None" },
          { value: Hardware.Computer, display: "Computer" },
          { value: Hardware.Laptop, display: "Laptop" },
          { value: Hardware["Common PC"], display: "Common PC" },
        ]}
      />
    );
  }

  function BasicResources() {
    return getAllResource.data?.map(
      (r) =>
        !r.isSpecial &&
        r.id != 4 &&
        r.id != 5 &&
        r.id != 6 && (
          <div key={r.id} className="flex items-center gap-2">
            <Checkbox
              id={r.id.toString()}
              name={r.id.toString()}
              value={r.id}
              checked={toRequest.includes(r.id)}
              onCheckedChange={(checked) => {
                if (checked) setToRequest([...toRequest, r.id]);
                else setToRequest(toRequest.filter((id) => id !== r.id));
              }}
            />
            <FieldLabel htmlFor={r.id.toString()}>{r.name}</FieldLabel>
          </div>
        ),
    );
  }

  const reset = () => {
    setSelectedEmployee(null);
    setShowEmployeeHasNAFAlert(false);
    setToRequest([]);
    setSelectedHardware(Hardware.None);
  };
  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("called");

    if (!selectedEmployee) return;
    const payload = {
      employeeId: selectedEmployee.id,
      requestorId: "0011134",
      resourceIds: [...toRequest, Number(selectedHardware)],
    };
    try {
      await createNAFAsync(payload);
      reset();
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (employeeNAFs.data && employeeNAFs.data.length > 0) {
      setShowEmployeeHasNAFAlert(true);
    } else {
      setShowEmployeeHasNAFAlert(false);
    }
    console.log(employeeNAFs.data);
  }, [employeeNAFs.data]);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  useEffect(() => {
    console.log(toRequest);
  }, [toRequest]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-amber-500 text-white cursor-pointer hover:bg-amber-600 hover:text-white"
        >
          + Network Access Form
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-md md:max-w-2xl lg:max-w-4xl md:h-[95vh] flex flex-col">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-amber-600">
              Create NAF
            </DialogTitle>
            <DialogDescription>Confidential Information</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center">
            {selectedEmployee ? (
              <p className="text-2xl text-amber-600 font-bold">
                Employee Details
              </p>
            ) : (
              <p className="text-2xl text-amber-600 font-bold">
                Select Employee
              </p>
            )}

            <SearchBar<Employee>
              fetchResults={fetchEmployee}
              placeholder="Search for employee"
              onSelect={(e: Employee) => setSelectedEmployee(e)}
              getKey={(e: Employee) => e.id}
              getValue={(e: Employee) => e.id}
              renderItem={(e) => (
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{`${e.lastName}, ${e.firstName} ${e.middleName} (${e.id})`}</span>
                  <span className="text-xs text-gray-400">{e.position}</span>
                </div>
              )}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-around flex-1  overflow-y-auto">
            <div className="flex flex-col p-4 w-full border overflow-y-auto justify-center">
              {!selectedEmployee ? (
                <div className="w-full max-w-full grid place-items-center overflow-hidden">
                  <img
                    src={search}
                    alt="Search Employee"
                    className="max-w-md"
                  />
                </div>
              ) : (
                <>
                  <p className="font-bold">Employee Number</p>
                  <p>{selectedEmployee.id}</p>
                  <p className="font-bold">Name: </p>
                  <p>{`${selectedEmployee.lastName}, ${selectedEmployee.firstName} ${selectedEmployee.middleName}`}</p>
                  <p className="font-bold">Company</p>
                  <p>{selectedEmployee.company}</p>
                  <p className="font-bold">Department</p>
                  <p>{selectedEmployee.departmentDesc}</p>
                  <p className="font-bold">Location</p>
                  <p>{selectedEmployee.location}</p>
                </>
              )}
            </div>
            {!loading && selectedEmployee && (
              <div className="w-full flex flex-col gap-4 border p-4 justify-center ">
                {showEmployeeHasNAFAlert ? (
                  <EmployeeHasNAFAlert />
                ) : (
                  <div className="flex flex-col gap-2 overflow-y-auto">
                    <p className="font-bold text-amber-500">Resources</p>
                    <HardwareSelect />
                    <BasicResources />
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={showEmployeeHasNAFAlert}>
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
